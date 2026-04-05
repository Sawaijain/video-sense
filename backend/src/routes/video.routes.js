const { Router } = require('express');
const {
  uploadVideo,
  listVideos,
  getVideo,
  updateVideo,
  deleteVideo,
  streamVideo,
  reprocessVideo,
} = require('../controllers/video.controller');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const tenancy = require('../middleware/tenancy');
const upload = require('../middleware/upload');

const router = Router();

// All routes require auth + tenancy
router.use(auth, tenancy);

router.get('/', listVideos);
router.get('/:id', getVideo);
router.get('/:id/stream', streamVideo);

// Editor/Admin only
router.post('/', rbac('editor', 'admin'), upload.single('video'), uploadVideo);
router.patch('/:id', rbac('editor', 'admin'), updateVideo);
router.delete('/:id', rbac('editor', 'admin'), deleteVideo);
router.post('/:id/reprocess', rbac('editor', 'admin'), reprocessVideo);

module.exports = router;
