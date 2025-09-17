/* ========================================
   GlobalWay - Backend Server
   ======================================== */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Web3 = require('web3');
const nodemailer = require('nodemailer');

// Инициализация Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Конфигурация
const config = {
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/globalway',
    WEB3_PROVIDER: 'https://opbnb-mainnet-rpc.bnbchain.org',
    ADMIN_ADDRESSES: [
        '0x7261b8aeaee2f806f64001596a67d68f2055acd2', // Owner
        '0x03284a899147f5a07f82c622f34df92198671635', // Founder F1
        '0x9b49bd9c9458615e11c051afd1ebe983563b67ee', // Founder F2
        '0xc2b58114cbc873cf360f7a673e4d8ee25d1431e7'  // Founder F3
    ]
};

// Web3 инициализация
const web3 = new Web3(config.WEB3_PROVIDER);

// ========== MongoDB Schemas ==========

// Подключение к MongoDB
mongoose.connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Схема пользователя
const UserSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    userId: {
        type: Number,
        required: true,
        unique: true
    },
    sponsorAddress: String,
    registrationDate: {
        type: Date,
        default: Date.now
    },
    metadata: {
        email: String,
        telegram: String,
        language: {
            type: String,
            default: 'en'
        }
    }
});

// Схема предложения проекта
const ProjectProposalSchema = new mongoose.Schema({
    author: String,
    contact: String,
    sphere: String,
    projectName: String,
    description: String,
    submittedBy: {
        type: String,
        required: true,
        lowercase: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'approved', 'rejected'],
        default: 'pending'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: Date,
    reviewedBy: String,
    reviewNotes: String
});

// Схема голосования
const VotingSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['withdrawal', 'project', 'delegation', 'other'],
        required: true
    },
    title: String,
    description: String,
    initiatedBy: {
        type: String,
        required: true,
        lowercase: true
    },
    data: mongoose.Schema.Types.Mixed,
    votes: [{
        voter: String,
        vote: {
            type: String,
            enum: ['yes', 'no', 'abstain']
        },
        timestamp: Date,
        note: String
    }],
    status: {
        type: String,
        enum: ['active', 'passed', 'rejected', 'expired'],
        default: 'active'
    },
    requiredVotes: {
        type: Number,
        default: 8
    },
    expiresAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Схема истории транзакций
const TransactionHistorySchema = new mongoose.Schema({
    userAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    type: {
        type: String,
        enum: ['levelPurchase', 'quarterlyPayment', 'referralBonus', 'matrixBonus', 'tokenPurchase', 'tokenSale', 'withdrawal'],
        required: true
    },
    txHash: String,
    blockNumber: Number,
    amount: String,
    level: Number,
    fromAddress: String,
    toAddress: String,
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    }
});

// Схема уведомлений
const NotificationSchema = new mongoose.Schema({
    userAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    type: {
        type: String,
        enum: ['system', 'referral', 'level', 'payment', 'voting', 'news'],
        required: true
    },
    title: String,
    message: String,
    data: mongoose.Schema.Types.Mixed,
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Модели
const User = mongoose.model('User', UserSchema);
const ProjectProposal = mongoose.model('ProjectProposal', ProjectProposalSchema);
const Voting = mongoose.model('Voting', VotingSchema);
const TransactionHistory = mongoose.model('TransactionHistory', TransactionHistorySchema);
const Notification = mongoose.model('Notification', NotificationSchema);

// ========== Middleware ==========

// Проверка JWT токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Проверка админских прав
const requireAdmin = (req, res, next) => {
    if (!config.ADMIN_ADDRESSES.includes(req.user.address.toLowerCase())) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ========== API Routes ==========

// Проверка подписи сообщения
const verifySignature = (address, message, signature) => {
    try {
        const recoveredAddress = web3.eth.accounts.recover(message, signature);
        return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
        return false;
    }
};

// Аутентификация
app.post('/api/auth/login', async (req, res) => {
    try {
        const { address, message, signature } = req.body;
        
        if (!verifySignature(address, message, signature)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }
        
        // Проверяем или создаем пользователя
        let user = await User.findOne({ address: address.toLowerCase() });
        if (!user) {
            // Генерируем уникальный ID
            let userId;
            do {
                userId = Math.floor(1000000 + Math.random() * 9000000);
            } while (await User.findOne({ userId }));
            
            user = await User.create({
                address: address.toLowerCase(),
                userId: userId
            });
        }
        
        // Создаем JWT токен
        const token = jwt.sign(
            { address: user.address, userId: user.userId },
            config.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            token,
            user: {
                address: user.address,
                userId: user.userId,
                isAdmin: config.ADMIN_ADDRESSES.includes(user.address)
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Получение информации о пользователе
app.get('/api/users/:addressOrId', authenticateToken, async (req, res) => {
    try {
        const { addressOrId } = req.params;
        let user;
        
        if (web3.utils.isAddress(addressOrId)) {
            user = await User.findOne({ address: addressOrId.toLowerCase() });
        } else {
            user = await User.findOne({ userId: parseInt(addressOrId) });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Обновление метаданных пользователя
app.put('/api/users/metadata', authenticateToken, async (req, res) => {
    try {
        const { email, telegram, language } = req.body;
        
        const user = await User.findOneAndUpdate(
            { address: req.user.address },
            { 
                $set: {
                    'metadata.email': email,
                    'metadata.telegram': telegram,
                    'metadata.language': language
                }
            },
            { new: true }
        );
        
        res.json(user);
    } catch (error) {
        console.error('Update metadata error:', error);
        res.status(500).json({ error: 'Failed to update metadata' });
    }
});

// ========== Project Proposals ==========

// Отправка предложения проекта
app.post('/api/projects/propose', authenticateToken, async (req, res) => {
    try {
        const proposal = await ProjectProposal.create({
            ...req.body,
            submittedBy: req.user.address
        });
        
        // Уведомляем админов
        for (const adminAddress of config.ADMIN_ADDRESSES) {
            await Notification.create({
                userAddress: adminAddress,
                type: 'system',
                title: 'New Project Proposal',
                message: `New project proposal: ${proposal.projectName}`,
                data: { proposalId: proposal._id }
            });
        }
        
        res.json(proposal);
    } catch (error) {
        console.error('Project proposal error:', error);
        res.status(500).json({ error: 'Failed to submit proposal' });
    }
});

// Получение предложений проектов (админ)
app.get('/api/projects/proposals', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        
        const proposals = await ProjectProposal.find(query)
            .sort('-submittedAt')
            .limit(100);
        
        res.json(proposals);
    } catch (error) {
        console.error('Get proposals error:', error);
        res.status(500).json({ error: 'Failed to get proposals' });
    }
});

// Обновление статуса предложения (админ)
app.put('/api/projects/proposals/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status, reviewNotes } = req.body;
        
        const proposal = await ProjectProposal.findByIdAndUpdate(
            req.params.id,
            {
                status,
                reviewNotes,
                reviewedAt: new Date(),
                reviewedBy: req.user.address
            },
            { new: true }
        );
        
        // Уведомляем автора
        await Notification.create({
            userAddress: proposal.submittedBy,
            type: 'system',
            title: 'Project Proposal Update',
            message: `Your project proposal "${proposal.projectName}" has been ${status}`,
            data: { proposalId: proposal._id, status }
        });
        
        res.json(proposal);
    } catch (error) {
        console.error('Update proposal error:', error);
        res.status(500).json({ error: 'Failed to update proposal' });
    }
});

// ========== Voting System ==========

// Создание голосования
app.post('/api/voting/create', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { type, title, description, data, requiredVotes, expiresIn } = req.body;
        
        const voting = await Voting.create({
            type,
            title,
            description,
            data,
            initiatedBy: req.user.address,
            requiredVotes: requiredVotes || 8,
            expiresAt: new Date(Date.now() + (expiresIn || 7 * 24 * 60 * 60 * 1000)) // 7 дней по умолчанию
        });
        
        // Уведомляем всех с правом голоса
        for (const adminAddress of config.ADMIN_ADDRESSES) {
            if (adminAddress !== req.user.address) {
                await Notification.create({
                    userAddress: adminAddress,
                    type: 'voting',
                    title: 'New Voting',
                    message: `New voting: ${title}`,
                    data: { votingId: voting._id }
                });
            }
        }
        
        res.json(voting);
    } catch (error) {
        console.error('Create voting error:', error);
        res.status(500).json({ error: 'Failed to create voting' });
    }
});

// Голосование
app.post('/api/voting/:id/vote', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { vote, note } = req.body;
        
        const voting = await Voting.findById(req.params.id);
        if (!voting || voting.status !== 'active') {
            return res.status(400).json({ error: 'Voting not active' });
        }
        
        // Проверяем, не голосовал ли уже
        const existingVote = voting.votes.find(v => v.voter === req.user.address);
        if (existingVote) {
            return res.status(400).json({ error: 'Already voted' });
        }
        
        // Добавляем голос
        voting.votes.push({
            voter: req.user.address,
            vote,
            timestamp: new Date(),
            note
        });
        
        // Проверяем достаточно ли голосов
        const yesVotes = voting.votes.filter(v => v.vote === 'yes').length;
        const noVotes = voting.votes.filter(v => v.vote === 'no').length;
        
        if (yesVotes >= voting.requiredVotes) {
            voting.status = 'passed';
            // Выполняем действие в зависимости от типа голосования
            await executeVotingAction(voting);
        } else if (noVotes > config.ADMIN_ADDRESSES.length - voting.requiredVotes) {
            voting.status = 'rejected';
        }
        
        await voting.save();
        res.json(voting);
    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({ error: 'Failed to vote' });
    }
});

// Выполнение действия после голосования
async function executeVotingAction(voting) {
    switch (voting.type) {
        case 'withdrawal':
            // Здесь будет логика вывода средств
            console.log('Executing withdrawal:', voting.data);
            break;
        case 'project':
            // Здесь будет логика одобрения проекта
            console.log('Executing project approval:', voting.data);
            break;
        case 'delegation':
            // Здесь будет логика делегирования прав
            console.log('Executing delegation:', voting.data);
            break;
    }
}

// ========== Transaction History ==========

// Сохранение транзакции
app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const transaction = await TransactionHistory.create({
            userAddress: req.user.address,
            ...req.body
        });
        
        res.json(transaction);
    } catch (error) {
        console.error('Save transaction error:', error);
        res.status(500).json({ error: 'Failed to save transaction' });
    }
});

// Получение истории транзакций
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const { type, limit = 50, skip = 0 } = req.query;
        const query = { userAddress: req.user.address };
        
        if (type) query.type = type;
        
        const transactions = await TransactionHistory.find(query)
            .sort('-timestamp')
            .limit(parseInt(limit))
            .skip(parseInt(skip));
        
        const total = await TransactionHistory.countDocuments(query);
        
        res.json({ transactions, total });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

// ========== Notifications ==========

// Получение уведомлений
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const notifications = await Notification.find({
            userAddress: req.user.address,
            read: false
        })
        .sort('-createdAt')
        .limit(50);
        
        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

// Отметить уведомление как прочитанное
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                userAddress: req.user.address
            },
            { read: true }
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Mark notification error:', error);
        res.status(500).json({ error: 'Failed to mark notification' });
    }
});

// ========== Mailing System ==========

// Email транспорт (настройте под ваш SMTP)
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Отправка рассылки (админ)
app.post('/api/mailing/send', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { subject, message, recipients, filters } = req.body;
        
        let users;
        if (recipients && recipients.length > 0) {
            // Конкретные получатели
            users = await User.find({
                $or: [
                    { address: { $in: recipients } },
                    { userId: { $in: recipients } }
                ]
            });
        } else {
            // Фильтры
            const query = {};
            if (filters) {
                // Применяем фильтры (уровни, квалификации и т.д.)
            }
            users = await User.find(query);
        }
        
        // Создаем уведомления для всех
        const notifications = users.map(user => ({
            userAddress: user.address,
            type: 'news',
            title: subject,
            message: message,
            createdAt: new Date()
        }));
        
        await Notification.insertMany(notifications);
        
        // Отправляем email тем, у кого есть
        const emailPromises = users
            .filter(user => user.metadata && user.metadata.email)
            .map(user => emailTransporter.sendMail({
                from: process.env.EMAIL_FROM || 'noreply@globalway.club',
                to: user.metadata.email,
                subject: subject,
                html: message
            }));
        
        await Promise.allSettled(emailPromises);
        
        res.json({ 
            success: true, 
            notificationsSent: notifications.length,
            emailsSent: emailPromises.length
        });
    } catch (error) {
        console.error('Mailing error:', error);
        res.status(500).json({ error: 'Failed to send mailing' });
    }
});

// ========== Database Export ==========

// Экспорт базы данных (админ)
app.get('/api/admin/export', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const data = {
            timestamp: new Date(),
            users: await User.find({}),
            proposals: await ProjectProposal.find({}),
            transactions: await TransactionHistory.find({}),
            votings: await Voting.find({})
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=globalway_export_${Date.now()}.json`);
        res.json(data);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// ========== WebSocket для real-time уведомлений ==========

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// WebSocket аутентификация
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, config.JWT_SECRET);
        socket.userId = decoded.address;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

// WebSocket подключение
io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);
    
    // Присоединяем к персональной комнате
    socket.join(socket.userId);
    
    // Отправляем непрочитанные уведомления
    Notification.find({
        userAddress: socket.userId,
        read: false
    })
    .sort('-createdAt')
    .limit(10)
    .then(notifications => {
        socket.emit('unreadNotifications', notifications);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
    });
});

// Функция отправки real-time уведомления
function sendRealtimeNotification(userAddress, notification) {
    io.to(userAddress).emit('newNotification', notification);
}

// ========== Запуск сервера ==========

server.listen(PORT, () => {
    console.log(`GlobalWay server running on port ${PORT}`);
});

module.exports = app;
