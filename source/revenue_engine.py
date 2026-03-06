# revenue_engine.py
from typing import List, Dict, Any, Tuple
import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
from mlxtend.frequent_patterns import apriori, association_rules

# Load environment variables (from backend folder or local)
load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))
load_dotenv()

# ---------------------------
# Helper & core functions
# ---------------------------

def fetch_from_supabase(table_name="orders") -> pd.DataFrame:
    """
    Fetch data from Supabase database.
    Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
    """
    try:
        from supabase import create_client, Client
    except ImportError:
        raise ImportError("Please install the 'supabase' library to use database features: pip install supabase")

    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) not found in environment variables.")
    
    supabase: Client = create_client(url, key)
    # Ensure there"s an orders table with OrderID, Item, Price, Cost, Quantity (optional), Time (optional)
    response = supabase.table(table_name).select("*").execute()
    data = response.data
    if not data:
        # Return empty dataframe with expected columns if no data
        return pd.DataFrame(columns=["OrderID", "Item", "Price", "Cost", "Quantity", "Time"])
    return pd.DataFrame(data)

def load_data(source) -> pd.DataFrame:
    """
    Load data from a CSV path, a DataFrame, or 'supabase'.
    Required columns: OrderID, Item, Price, Cost, Quantity (optional), Time (optional)
    """
    if isinstance(source, pd.DataFrame):
        df = source.copy()
    elif isinstance(source, str) and source.lower().startswith("supabase"):
        # e.g., "supabase:orders"
        parts = source.split(":")
        table_name = parts[1] if len(parts) > 1 else "orders"
        df = fetch_from_supabase(table_name)
    else:
        df = pd.read_csv(source)
        
    # normalize column names
    df = df.rename(columns=lambda c: str(c).strip())
    required = ["OrderID", "Item", "Price", "Cost"]
    for c in required:
        if c not in df.columns:
            raise ValueError(f"Missing required column: {c}")
    if "Quantity" not in df.columns:
        df["Quantity"] = 1
    else:
        df["Quantity"] = df["Quantity"].fillna(1)
    # Ensure types
    df["Price"] = pd.to_numeric(df["Price"], errors="coerce").fillna(0)
    df["Cost"] = pd.to_numeric(df["Cost"], errors="coerce").fillna(0)
    df["Quantity"] = pd.to_numeric(df["Quantity"], errors="coerce").fillna(1).astype(int)
    if "Time" in df.columns:
        # try parse to datetime
        try:
            df["Time"] = pd.to_datetime(df["Time"], errors="coerce")
        except Exception:
            df["Time"] = pd.to_datetime(df["Time"].astype(str), format="%H:%M", errors="coerce")
    else:
        df["Time"] = pd.NaT
    return df

def contribution_margin(df: pd.DataFrame) -> pd.DataFrame:
    """
    Returns DataFrame with Item, Price (avg), Cost (avg), Margin (Price - Cost)
    Also include total_margin = margin * total_quantity and total_revenue
    """
    grouped = df.groupby("Item").agg(
        avg_price = ("Price", "mean"),
        avg_cost  = ("Cost", "mean"),
        total_qty = ("Quantity", "sum"),
        total_revenue = (lambda x: None, "first")  # placeholder; will compute below
    ).reset_index()
    # compute total_revenue and total_cost properly
    item_totals = df.groupby("Item").apply(lambda g: pd.Series({
        "total_revenue": (g["Price"] * g["Quantity"]).sum(),
        "total_cost": (g["Cost"] * g["Quantity"]).sum(),
    })).reset_index()
    grouped = grouped.drop(columns=["total_revenue"])
    grouped = grouped.merge(item_totals, on="Item")
    grouped["margin_per_unit"] = grouped["avg_price"] - grouped["avg_cost"]
    grouped["total_margin"] = grouped["total_revenue"] - grouped["total_cost"]
    # ensure numeric
    for col in ["avg_price","avg_cost","margin_per_unit","total_revenue","total_cost","total_margin","total_qty"]:
        grouped[col] = pd.to_numeric(grouped[col], errors="coerce").fillna(0)
    return grouped[[
        "Item","avg_price","avg_cost","margin_per_unit","total_qty","total_revenue","total_cost","total_margin"
    ]]

def sales_popularity(df: pd.DataFrame) -> pd.DataFrame:
    """
    Returns DataFrame Item | total_orders | distinct_order_count
    total_orders = total quantity sold
    distinct_order_count = number of distinct orders containing item
    """
    total_qty = df.groupby("Item")["Quantity"].sum().rename("total_qty")
    distinct_orders = df.groupby("Item")["OrderID"].nunique().rename("orders_with_item")
    out = pd.concat([total_qty, distinct_orders], axis=1).reset_index()
    return out

def classify_menu(perf: pd.DataFrame,
                  margin_threshold: float = None,
                  sales_threshold_qty: float = None) -> Dict[str, List[str]]:
    """
    Classify items into Stars, Hidden Stars, Risk, Dead.
    Thresholds (if None) default to median-based splits.
    - High margin = margin_per_unit >= margin_threshold
    - High sales = total_qty >= sales_threshold_qty
    """
    df = perf.copy()
    # If thresholds not provided, choose medians
    if margin_threshold is None:
        margin_threshold = df["margin_per_unit"].median()
    if sales_threshold_qty is None:
        sales_threshold_qty = df["total_qty"].median()
    stars = df[(df["margin_per_unit"] >= margin_threshold) & (df["total_qty"] >= sales_threshold_qty)]["Item"].tolist()
    hidden = df[(df["margin_per_unit"] >= margin_threshold) & (df["total_qty"] < sales_threshold_qty)]["Item"].tolist()
    risk = df[(df["margin_per_unit"] < margin_threshold) & (df["total_qty"] >= sales_threshold_qty)]["Item"].tolist()
    dead = df[(df["margin_per_unit"] < margin_threshold) & (df["total_qty"] < sales_threshold_qty)]["Item"].tolist()
    return {
        "stars": stars,
        "hidden_stars": hidden,
        "risk_items": risk,
        "dead_items": dead,
        "margin_threshold": float(margin_threshold),
        "sales_qty_threshold": float(sales_threshold_qty)
    }

def prepare_basket(df: pd.DataFrame) -> pd.DataFrame:
    """
    Prepare transaction-item one-hot encoded table for apriori.
    Returns transactions DataFrame with one row per OrderID and boolean columns per Item.
    Filters: optional minimal frequency handled in apriori.
    """
    basket = df.groupby(["OrderID", "Item"])["Quantity"].sum().unstack(fill_value=0)
    # convert to 1/0 for presence using map or astype
    basket = basket.map(lambda x: 1 if x > 0 else 0).astype(bool)
    return basket

def find_combos(df: pd.DataFrame, min_support: float = 0.02, min_confidence: float = 0.3, max_len: int = 3) -> List[Dict[str,Any]]:
    """
    Run apriori and association_rules to find strong combos.
    Returns list of recommended combos with support/confidence/lift.
    """
    basket = prepare_basket(df)
    if basket.sum().sum() == 0:
        return []
    # Frequent itemsets
    frequent_itemsets = apriori(basket, min_support=min_support, use_colnames=True, max_len=max_len)
    if frequent_itemsets.empty:
        return []
    rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_confidence)
    # Rules may have antecedents/consequents as frozensets
    rules_sorted = rules.sort_values(["confidence","lift","support"], ascending=[False,False,False])
    combos = []
    for _, r in rules_sorted.iterrows():
        ant = sorted(list(r["antecedents"]))
        cons = sorted(list(r["consequents"]))
        # recommended combo could be ant + cons (items frequently together)
        combo = sorted(list(set(ant + cons)))
        combos.append({
            "antecedent": ant,
            "consequent": cons,
            "combo": combo,
            "support": float(r["support"]),
            "confidence": float(r["confidence"]),
            "lift": float(r["lift"])
        })
    # Deduplicate combos by combo list
    seen = set()
    dedup = []
    for c in combos:
        key = tuple(c["combo"])
        if key in seen:
            continue
        seen.add(key)
        dedup.append(c)
    return dedup

def upsell_rank(perf: pd.DataFrame) -> pd.DataFrame:
    """
    Compute Upsell Score = margin_per_unit * total_qty (popularity)
    Return items sorted by upsell score descending
    """
    df = perf.copy()
    df["upsell_score"] = df["margin_per_unit"] * df["total_qty"]
    df = df.sort_values("upsell_score", ascending=False)
    return df[["Item","margin_per_unit","total_qty","upsell_score"]]

def peak_hour_analysis(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Identify peak hours and hourly order counts.
    Returns peak hour(s), hourly counts.
    """
    if df["Time"].isna().all():
        return {"peak_hours": [], "hourly_counts": {}}
    tmp = df.dropna(subset=["Time"]).copy()
    # Ensure Time is datetime
    tmp["hour"] = tmp["Time"].dt.hour
    # Count distinct orders by hour (an order may have multiple rows)
    hourly = tmp.groupby("OrderID").first().groupby("hour").size().rename("orders").reset_index()
    # Alternatively count all items sold per hour:
    hourly_items = tmp.groupby("hour")["Quantity"].sum().rename("items_sold").reset_index()
    hourly = hourly.merge(hourly_items, on="hour", how="outer").fillna(0).sort_values("hour")
    if hourly.empty:
        return {"peak_hours": [], "hourly_counts": {}}
    max_orders = hourly["orders"].max()
    peak_hours = hourly[hourly["orders"] == max_orders]["hour"].tolist()
    hourly_counts = {int(r["hour"]): int(r["orders"]) for _, r in hourly.iterrows()}
    return {"peak_hours": peak_hours, "hourly_counts": hourly_counts}

def revenue_contribution(perf: pd.DataFrame) -> List[Tuple[str,float]]:
    """
    Returns list of (Item, revenue_pct) sorted descending
    """
    total_revenue = perf["total_revenue"].sum()
    if total_revenue == 0:
        return []
    perf = perf.sort_values("total_revenue", ascending=False)
    perf["revenue_pct"] = perf["total_revenue"] / total_revenue * 100.0
    return list(perf[["Item","revenue_pct"]].itertuples(index=False, name=None))

def ai_menu_doctor(classification: Dict[str,List[str]],
                   combos: List[Dict[str,Any]],
                   upsell_top: List[str],
                   revenue_share: List[Tuple[str,float]]) -> List[str]:
    """
    Generate simple human-readable recommendations.
    Returns list of strings.
    """
    recs = []
    # Promote hidden stars
    for item in classification.get("hidden_stars", []):
        recs.append(f"Promote {item} — high margin but low sales.")
    # Create combos from top combos (pick top 3 combos)
    seen_combo_items = set()
    for c in combos[:5]:
        combo = c["combo"]
        recs.append(f"Create combo: {' + '.join(combo)} (support {c['support']:.2f}, confidence {c['confidence']:.2f})")
        seen_combo_items.update(combo)
    # Upsell suggestion
    if upsell_top:
        recs.append(f"Upsell suggestion: {upsell_top[0]} — high upsell score.")
    # Remove dead items
    for item in classification.get("dead_items", []):
        recs.append(f"Consider removing {item} — low margin and low sales.")
    # Price increase suggestions for items with very high revenue share
    for item, pct in revenue_share[:3]:
        if pct > 25:
            recs.append(f"Consider small price increase for {item} — contributes {pct:.1f}% of revenue.")
    return recs

# ---------------------------
# End-to-end wrapper 
# ---------------------------

def run_revenue_engine(source="supabase:orders",
                       min_support: float = 0.02,
                       min_confidence: float = 0.3,
                       combo_max_len: int = 3,
                       margin_threshold: float = None,
                       sales_threshold_qty: float = None,
                       top_upsell_n: int = 3) -> Dict[str, Any]:
    """
    Main entry point. Returns a dictionary of insights ready for a frontend.
    source defaults to 'supabase:orders' to fetch directly from connected Database.
    """
    df = load_data(source)
    if df.empty:
        return {"error": "No data found or empty DataFrame returned."}
    # Basic aggregations
    perf = contribution_margin(df)  # contains margin_per_unit, total_qty, total_revenue, total_margin
    popularity = sales_popularity(df)  # total_qty, orders_with_item
    # Merge
    perf = perf.merge(popularity, on="Item", how="left")
    perf["total_qty"] = perf["total_qty"].fillna(0).astype(int)
    perf["orders_with_item"] = perf["orders_with_item"].fillna(0).astype(int)
    # Classification
    classification = classify_menu(perf, margin_threshold=margin_threshold, sales_threshold_qty=sales_threshold_qty)
    # Combos
    combos = find_combos(df, min_support=min_support, min_confidence=min_confidence, max_len=combo_max_len)
    # Upsell
    upsell_df = upsell_rank(perf)
    upsell_top = upsell_df["Item"].tolist()[:top_upsell_n]
    # Peak hours
    peak = peak_hour_analysis(df)
    # Revenue contribution
    revenue_share = revenue_contribution(perf)
    # Menu doctor
    menu_recs = ai_menu_doctor(classification, combos, upsell_top, revenue_share)
    # Structured output
    output = {
        "top_sellers": perf.sort_values("total_qty", ascending=False)["Item"].tolist()[:10],
        "hidden_stars": classification["hidden_stars"],
        "stars": classification["stars"],
        "risk_items": classification["risk_items"],
        "dead_items": classification["dead_items"],
        "recommended_combos": [c["combo"] for c in combos[:10]],
        "combo_details": combos[:10],
        "upsell_recommendations": upsell_top,
        "upsell_table": upsell_df.to_dict(orient="records"),
        "menu_doctor_recommendations": menu_recs,
        "peak_hours": peak["peak_hours"],
        "hourly_counts": peak["hourly_counts"],
        "revenue_share": [{ "item": r[0], "pct": r[1] } for r in revenue_share],
        "internal": {
            "margin_threshold": classification.get("margin_threshold"),
            "sales_qty_threshold": classification.get("sales_qty_threshold")
        }
    }
    return output

# ---------------------------
# Example usage (uncomment for testing)
# ---------------------------
if __name__ == "__main__":
    # Example inline data
    sample = pd.DataFrame([
        {"OrderID":1,"Item":"Pizza","Price":250,"Cost":120,"Quantity":1,"Time":"19:20"},
        {"OrderID":1,"Item":"Coke","Price":50,"Cost":20,"Quantity":1,"Time":"19:20"},
        {"OrderID":2,"Item":"Burger","Price":150,"Cost":90,"Quantity":1,"Time":"20:05"},
        {"OrderID":2,"Item":"Fries","Price":80,"Cost":30,"Quantity":1,"Time":"20:05"},
        {"OrderID":3,"Item":"Garlic Bread","Price":90,"Cost":20,"Quantity":1,"Time":"19:45"},
        {"OrderID":4,"Item":"Pizza","Price":250,"Cost":120,"Quantity":1,"Time":"19:50"},
        {"OrderID":4,"Item":"Garlic Bread","Price":90,"Cost":20,"Quantity":1,"Time":"19:50"},
        {"OrderID":5,"Item":"Coke","Price":50,"Cost":20,"Quantity":2,"Time":"21:00"},
    ])
    try:
        print("Testing with Supabase (if configured in .env):")
        out = run_revenue_engine("supabase:orders", min_support=0.2, min_confidence=0.4)
        import json
        print(json.dumps(out, indent=2))
    except Exception as e:
        print(f"Supabase connection failed or not setup correctly: {e}")
        print("\\nFalling back to sample data:")
        out = run_revenue_engine(sample, min_support=0.2, min_confidence=0.4)
        import json
        print(json.dumps(out, indent=2))
