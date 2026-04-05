const { Router } = require('express');
const { listUsers, updateRole, toggleActive } = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = Router();

router.use(auth, rbac('admin'));

router.get('/', listUsers);
router.patch('/:id/role', updateRole);
router.patch('/:id/active', toggleActive);

module.exports = router;
