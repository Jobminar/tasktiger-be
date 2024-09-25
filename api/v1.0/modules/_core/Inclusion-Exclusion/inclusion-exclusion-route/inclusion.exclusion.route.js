import express from 'express';
import inclusionExclusionController from '../inclusion-exclusion-controller/inclusion.exclusion.controller.js';

const router = express.Router();

// Route to create a new InclusionExclusion entry
router.post('/', inclusionExclusionController.createInclusionExclusion);

router.get('/', inclusionExclusionController.getAllInclusionExclusion);

router.get('/:serviceId',inclusionExclusionController.getInclusionExclusionByServiceId)

router.patch('/:id',inclusionExclusionController.updateInclusionExclusion)

router.delete('/:id',inclusionExclusionController.deleteInclusionExclusion)

export default router;
