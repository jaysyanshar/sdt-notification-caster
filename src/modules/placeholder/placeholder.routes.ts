import { Router } from 'express';
import { PlaceholderController } from './placeholder.controller';

const router = Router();
const placeholderController = new PlaceholderController();

router.get('/hello-world', placeholderController.getHelloWorld);

export default router;
