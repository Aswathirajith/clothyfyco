const Order = require('../../models/orderdbSchema');
const moment = require('moment');
const mongoose = require('mongoose');

const ordersLoad = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = 4;
        const skip = (page - 1) * pageSize;

        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / pageSize);

        const sortedOrderData = await Order.aggregate([
            {
                $lookup: {
                    from: 'users', 
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user' 
            },
            {
                $sort: { date: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: pageSize
            }
        ]);

        res.render("admin/orders", {
            sortedOrderData,
            totalPages,
            currentPage: page
        });

    } catch (error) {
        res.render('admin/404error');
    }
};

// changing order status - shipping
const shippedStatusChange = async (req, res) => {
    try {
        const {orderId} = req.params;
        const {productId} = req.body;

        const order = await Order.findOne({ _id: orderId });

        if (!order) {
            return res.json({ error: 'Order not found' });
        }

        const productToUpdate = order.products.find(product => product._id.toString() === productId); 

        if (!productToUpdate) {
            return res.json({ error: 'Product not found in the order' });
        }

        if (productToUpdate.status === 'Order Shipped') {
            return res.json({ error: 'Product is already Shipped' });
        }

        if(productToUpdate.status === 'Order Delivered'){
            return res.json({ error: 'Product is already Delivered' });
        }

        if(productToUpdate.status === 'Cancelled by ClothifyEcom'){
            return res.json({ error: 'Product is already Cancelled by ClothifyEcom' });
        }
        
        productToUpdate.status = 'Order Shipped';
        await order.save();

        return res.json({ message: 'Order status updated to Shipped successfully' });

    } catch (error) {
        res.render('admin/404error');
    }
};



// changing order status - delivered
const deliveredStatusChange = async (req, res) => {
    try {
        const {orderId} = req.params;
        const {productId} = req.body;

        const order = await Order.findOne({ _id: orderId });

        if (!order) {
            return res.json({ error: 'Order not found' });
        }

        const productToUpdate = order.products.find(product => product._id.toString() === productId); 

        if (!productToUpdate) {
            return res.json({ error: 'Product not found in the order' });
        }

        if (productToUpdate.status === 'Order Placed') {
            return res.json({ error: 'Product is not Shipped yet' });
        }

        if(productToUpdate.status === 'Order Delivered'){
            return res.json({ error: 'Product is already Delivered' });
        }

        if(productToUpdate.status === 'Cancelled by ClothifyEcom'){
            return res.json({ error: 'Product is already Cancelled by ClothifyEcom' });
        }

        productToUpdate.status = 'Order Delivered';
        await order.save();

        return res.json({ message: 'Order status updated to Delivered successfully' });
    } catch (error) {
        res.render('admin/404error');
    }
};


// changing order status - cancelled
const cancelledStatusChange = async (req, res) => {
    try {
        const {orderId} = req.params;
        const {productId} = req.body;

        const order = await Order.findOne({ _id: orderId });

        if (!order) {
            return res.json({ error: 'Order not found' });
        }

        const product = order.products.find(prdct => prdct._id.toString() === productId);

        if (!product) {
            return res.json({ error: 'Product not found' });
        }

        if (product.status === 'Cancelled by ClothifyEcom') {
            return res.json({ error: 'Product is already cancelled' });
        }

        product.status = 'Cancelled by ClothifyEcom';
        await order.save();

        return res.json({ message: 'Order status updated to Cancelled successfully' });
    } catch (error) {
        res.render('admin/404error');
    }
};

// approve return request
const approveReturnRequest = async (req, res) => {
    try {
        const { productId, orderId } = req.body;

        console.log(productId, orderId);
        
        const orderData = await Order.findById({_id: orderId});
        if (orderData.products && orderData.products.length > 0) {
            const product = orderData.products.find(product => {
                return String(product._id) === String(productId);
            });

            if (product) {

                product.status = "Return Approved";

                await orderData.save();
        
                res.json({ message: 'Product approved successfully.' });
            } else {
                res.json({ error: 'Product not found in the order.' });
            }
        } else {
            res.json({ error: 'Order not found.' });
        }

    } catch (error) {
        res.render('admin/404error');
    }
};


// order details load
const orderDetails = async (req, res) => {

    try {

        const orderId = req.query.orderId;
        const orderData = await Order.find({_id: orderId }).populate([
            {path: 'userId'},
            {path: 'products.productId', 
                populate: {
                    path: 'offer'
                }
            }
        ]);

        const formattedDate = moment(orderData[0].date).format('MM DD YYYY HH:mm:ss');
        res.render("admin/orderDetails", {
            orderData: orderData,
            date: formattedDate
        });

    } catch (error) {

        
        res.render("admin/404error");
    }

}




module.exports ={
    ordersLoad,
    orderDetails,
    shippedStatusChange,
    deliveredStatusChange,
    cancelledStatusChange,
    approveReturnRequest
}