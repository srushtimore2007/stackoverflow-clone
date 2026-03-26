const Question = require('../models/question'); // Assuming you have this model
const User = require('../models/User');

/**
 * Create a new question
 * POST /questions/create
 */
const createQuestion = async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    const userId = req.user.id;
    
    // Get user from middleware (already checked for limits)
    const user = req.userWithSubscription;

    // Validate input
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }

    // Create question
    const question = new Question({
      title,
      body,
      tags: tags || [],
      author: userId,
      createdAt: new Date()
    });

    await question.save();

    // Increment user's daily question count
    user.dailyQuestionCount += 1;
    user.lastQuestionDate = new Date();
    await user.save();

    const remainingQuestions = user.getDailyQuestionLimit() === Infinity 
      ? 'Unlimited' 
      : user.getDailyQuestionLimit() - user.dailyQuestionCount;

    return res.status(201).json({
      success: true,
      message: 'Question posted successfully',
      question: {
        id: question._id,
        title: question.title,
        body: question.body,
        tags: question.tags,
        createdAt: question.createdAt
      },
      subscription: {
        currentPlan: user.subscriptionPlan,
        questionsPostedToday: user.dailyQuestionCount,
        questionsRemaining: remainingQuestions
      }
    });
  } catch (error) {
    console.error('Create question error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create question',
      error: error.message
    });
  }
};

/**
 * Get user's question history
 * GET /questions/my-questions
 */
const getMyQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const questions = await Question.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('author', 'name email');

    const count = await Question.countDocuments({ author: userId });

    return res.status(200).json({
      success: true,
      questions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalQuestions: count
    });
  } catch (error) {
    console.error('Get questions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error.message
    });
  }
};

module.exports = {
  createQuestion,
  getMyQuestions
};