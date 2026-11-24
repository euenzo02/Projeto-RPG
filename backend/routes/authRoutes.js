
import express from 'express';

import {
    cadastrar,
    login
} from '../controllers/authController.js';

const router = express.Router();

// Cadastro
router.post('/cadastro', cadastrar);

// Login
router.post('/login', login);

export default router;
