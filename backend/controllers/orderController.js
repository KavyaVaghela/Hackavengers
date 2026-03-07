const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.createManualOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { data: restaurant } = await supabase.from('restaurants').select('id').eq('userId', userId).single();
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found for this user.' });

        const restaurant_id = restaurant.id;
        const { customer_name, items, total_amount } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Order must contain at least one item.' });
        }

        let customer_id = null;

        // 1. Create or get customer
        if (customer_name && customer_name.trim() !== '') {
            const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .insert([{ restaurant_id, customer_name }])
                .select()
                .single();

            if (customerError) {
                console.error('Customer Creation Error:', customerError);
                return res.status(500).json({ error: 'Failed to save customer details.' });
            }
            customer_id = customerData.id;
        }

        // 2. Create the order
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{
                restaurant_id,
                customer_id,
                order_type: 'manual',
                total_amount
            }])
            .select()
            .single();

        if (orderError) {
            console.error('Order Creation Error:', orderError);
            return res.status(500).json({ error: 'Failed to create order.' });
        }

        const order_id = orderData.id;

        // 3. Create order items
        const orderItemsToInsert = items.map(item => ({
            order_id,
            menu_id: item.id,
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsToInsert);

        if (itemsError) {
            console.error('Order Items Error:', itemsError);
            return res.status(500).json({ error: 'Failed to save order items.' });
        }

        return res.status(201).json({
            message: 'Order created successfully',
            order_id
        });

    } catch (error) {
        console.error('Manual Order Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.createVoiceOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { data: restaurant } = await supabase.from('restaurants').select('id').eq('userId', userId).single();
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found for this user.' });

        const restaurant_id = restaurant.id;
        const { items, total_amount } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Voice order must contain at least one item.' });
        }

        // 1. Insert order with order_type = 'voice'
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{
                restaurant_id,
                customer_id: null,
                order_type: 'voice',
                total_amount
            }])
            .select()
            .single();

        if (orderError) {
            console.error('Voice Order Creation Error:', orderError);
            return res.status(500).json({ error: 'Failed to create voice order.' });
        }

        const order_id = orderData.id;

        // 2. Insert order_items
        const orderItemsToInsert = items.map(item => ({
            order_id,
            menu_id: item.id || null,
            item_name: item.name || item.item_name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsToInsert);

        if (itemsError) {
            console.error('Voice Order Items Error:', itemsError);
            return res.status(500).json({ error: 'Failed to save voice order items.' });
        }

        return res.status(201).json({
            message: 'Voice order placed successfully',
            order_id,
            order_type: 'voice',
            restaurant_id,
            total_amount,
            created_at: orderData.created_at
        });

    } catch (error) {
        console.error('Voice Order Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.getOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { data: restaurant } = await supabase.from('restaurants').select('id').eq('userId', userId).single();
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found for this user.' });

        const restaurant_id = restaurant.id;
        const { id } = req.params;

        // Fetch order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, customers(customer_name)')
            .eq('id', id)
            .eq('restaurant_id', restaurant_id)
            .single();

        if (orderError || !order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Fetch items
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', id);

        if (itemsError) {
            return res.status(500).json({ error: 'Failed to fetch order items.' });
        }

        return res.status(200).json({ order, items });

    } catch (error) {
        console.error('Get Order Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.generateBillPDF = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { data: restaurantData } = await supabase.from('restaurants').select('id, restaurantName').eq('userId', userId).single();
        if (!restaurantData) return res.status(404).json({ error: 'Restaurant not found for this user.' });

        const restaurant_id = restaurantData.id;
        const { order_id } = req.body;

        // Fetch order with customer
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, customers(customer_name)')
            .eq('id', order_id)
            .eq('restaurant_id', restaurant_id)
            .single();

        if (orderError || !order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        // Fetch items
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order_id);

        if (itemsError) {
            return res.status(500).json({ error: 'Failed to fetch order items.' });
        }

        // Headers mapped since we already fetched restaurantName
        const restaurant = { restaurant_name: restaurantData.restaurantName };

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bill-${order.id}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text(restaurant?.restaurant_name || 'PetPooja Restaurant', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text('TAX INVOICE', { align: 'center' });
        doc.moveDown();

        // Details
        doc.fontSize(10).text(`Date: ${new Date(order.created_at).toLocaleString()}`);
        doc.text(`Order ID: ${order.id.split('-')[0]}`);
        if (order.customers && order.customers.customer_name) {
            doc.text(`Customer: ${order.customers.customer_name}`);
        }
        doc.text(`Type: Walk-in / Manual`);
        doc.moveDown();

        // Items Table Header
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.text('Item', 50, doc.y, { continued: true });
        doc.text('Qty', 300, doc.y, { continued: true });
        doc.text('Price', 400, doc.y, { continued: true });
        doc.text('Total', 500, doc.y);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Items
        items.forEach(item => {
            const y = doc.y;
            doc.text(item.item_name, 50, y, { width: 230 });
            doc.text(item.quantity.toString(), 300, y);
            doc.text(`Rs. ${item.price.toFixed(2)}`, 400, y);
            doc.text(`Rs. ${item.subtotal.toFixed(2)}`, 500, y);
            doc.moveDown(0.5);
        });

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Total
        doc.fontSize(14).text(`Total Amount: Rs. ${parseFloat(order.total_amount).toFixed(2)}`, { align: 'right' });

        doc.moveDown(2);
        doc.fontSize(10).text('Thank you for visiting!', { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF.' });
        }
    }
};
