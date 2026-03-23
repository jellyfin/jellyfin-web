import express from 'express';
import { Activity } from '../models/Activity';

const router = express.Router();

router.get('/activities', async (req, res) => {
  try {
    const { page, pageSize, filter } = req.query;
    const activities = await Activity.find()
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    if (filter) {
      activities = activities.filter((activity) => activity.user.includes(filter));
    }
    res.json(activities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching activities' });
  }
});

export default router;