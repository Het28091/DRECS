import { Router } from 'express';
import authRoutes from './authRoutes';
import incidentRoutes from './incidentRoutes';
import volunteerRoutes from './volunteerRoutes';
import volunteerRequestRoutes from './volunteerRequestRoutes';
import assignmentRoutes from './assignmentRoutes';
import mapRoutes from './mapRoutes';
import shelterRoutes from './shelterRoutes';
import resourceRoutes from './resourceRoutes';
import notificationRoutes from './notificationRoutes';
import analyticsRoutes from './analyticsRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/incidents', incidentRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/volunteer-requests', volunteerRequestRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/map', mapRoutes);
router.use('/shelters', shelterRoutes);
router.use('/resources', resourceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

export { router as apiRoutes };
