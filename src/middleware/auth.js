const jwt = require('jsonwebtoken');
const { env } = require('../configs/environment');

module.exports = req => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split('Bearer ')[1];

        if (token) {
            try {
                const user = jwt.verify(token, env.JWT_SECRET);
                return user;
            } catch (error) {
                return null;
            }
        }
    }

    return null
};
