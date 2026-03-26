// import mongoose from "mongoose";
// import question from "../models/questions";


// export const Askquestion = async (req, res) => {
//   const { postquestiondata } = req.body;
//   const postques = new question({ ...postquestiondata });
//   try {
//     await postques.save();
//     res.status(200).json({ data: postques });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json("something went wrong..");
//     return;
//   }
// };

// export const getallquestion = async (req, res) => {
//   try {
//     const allquestion = await question.find().sort({ askedon: -1 });
//     res.status(200).json({ data: allquestion });
//   } catch (error) {
//     res.status(500).json("something went wrong..");
//     return;
//   }
// };
// export const deletequestion = async (req, res) => {
//   const { id: _id } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(_id)) {
//     return res.status(400).json({ message: "question unavailable" });
//   }
//   try {
//     await question.findByIdAndDelete(_id);
//     res.status(200).json({ message: "question deleted" });
//   } catch (error) {
//     res.status(500).json("something went wrong..");
//     return;
//   }
// };
// export const votequestion = async (req, res) => {
//   const { id: _id } = req.params;
//   const { value ,userid} = req.body;
//   if (!mongoose.Types.ObjectId.isValid(_id)) {
//     return res.status(400).json({ message: "question unavailable" });
//   }
//   try {
//     const questionDoc = await question.findById(_id);
//     const upindex = questionDoc.upvote.findIndex((id) => id === String(userid));
//     const downindex = questionDoc.downvote.findIndex(
//       (id) => id === String(userid)
//     );
//     if (value === "upvote") {
//       if (downindex !== -1) {
//         questionDoc.downvote = questionDoc.downvote.filter(
//           (id) => id !== String(userid)
//         );
//       }
//       if (upindex === -1) {
//         questionDoc.upvote.push(userid);
//       } else {
//         questionDoc.upvote = questionDoc.upvote.filter((id) => id !== String(userid));
//       }
//     } else if (value === "downvote") {
//       if (upindex !== -1) {
//         questionDoc.upvote = questionDoc.upvote.filter((id) => id !== String(userid));
//       }
//       if (downindex === -1) {
//         questionDoc.downvote.push(userid);
//       } else {
//         questionDoc.downvote = questionDoc.downvote.filter(
//           (id) => id !== String(userid)
//         );
//       }
//     }
//     const questionvote = await question.findByIdAndUpdate(_id, questionDoc, { new: true });
//     res.status(200).json({ data: questionvote });
//   } catch (error) {
//     res.status(500).json("something went wrong..");
//     return;
//   }
// };


import mongoose from "mongoose";
import Question from "../models/question.js";
import User from "../models/auth.js";

// ==========================
// ASK QUESTION (with subscription tracking)
// ==========================
export const Askquestion = async (req, res) => {
  try {
    const { postquestiondata } = req.body;
    const userId = req.userid; // Auth middleware sets req.userid

    // User is provided by checkQuestionLimit middleware
    const user = req.userWithSubscription;

    if (!user) {
      return res.status(500).json({
        success: false,
        message: "User data not found. Please try again.",
      });
    }

    // Validate question data
    if (!postquestiondata || !postquestiondata.questiontitle || !postquestiondata.questionbody) {
      return res.status(400).json({
        success: false,
        message: "Question title and body are required",
      });
    }

    // Create question
    const postquestion = new Question({
      ...postquestiondata,
      userid: userId,
      askedon: new Date(),
    });

    await postquestion.save();

    // ✅ Increment user's daily question count
    user.dailyQuestionCount += 1;
    user.lastQuestionDate = new Date();
    await user.save();

    const dailyLimit = user.getDailyQuestionLimit();
    const remainingQuestions =
      dailyLimit === Infinity
        ? "Unlimited"
        : Math.max(0, dailyLimit - user.dailyQuestionCount);

    res.status(201).json({
      success: true,
      message: "Question posted successfully",
      data: postquestion,
      subscription: {
        currentPlan: user.subscriptionPlan,
        questionsPostedToday: user.dailyQuestionCount,
        questionsRemaining: remainingQuestions,
      },
    });
  } catch (error) {
    console.error("Ask question error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to post question",
      error: error.message,
    });
  }
};

// ==========================
// GET ALL QUESTIONS
// ==========================
export const getallquestion = async (req, res) => {
  try {
    const allquestion = await Question.find().sort({ askedon: -1 });
    res.status(200).json({ data: allquestion });
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};

// ==========================
// DELETE QUESTION
// ==========================
export const deletequestion = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }

  try {
    await Question.findByIdAndDelete(_id);
    res.status(200).json({ message: "question deleted" });
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};

// ==========================
// VOTE QUESTION
// ==========================
export const votequestion = async (req, res) => {
  const { id: _id } = req.params;
  const { value, userid } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }

  try {
    const questionDoc = await Question.findById(_id);

    const upindex = questionDoc.upvote.findIndex(
      (id) => id === String(userid)
    );
    const downindex = questionDoc.downvote.findIndex(
      (id) => id === String(userid)
    );

    if (value === "upvote") {
      if (downindex !== -1) {
        questionDoc.downvote = questionDoc.downvote.filter(
          (id) => id !== String(userid)
        );
      }
      if (upindex === -1) {
        questionDoc.upvote.push(userid);
      } else {
        questionDoc.upvote = questionDoc.upvote.filter(
          (id) => id !== String(userid)
        );
      }
    } else if (value === "downvote") {
      if (upindex !== -1) {
        questionDoc.upvote = questionDoc.upvote.filter(
          (id) => id !== String(userid)
        );
      }
      if (downindex === -1) {
        questionDoc.downvote.push(userid);
      } else {
        questionDoc.downvote = questionDoc.downvote.filter(
          (id) => id !== String(userid)
        );
      }
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      _id,
      questionDoc,
      { new: true }
    );

    res.status(200).json({ data: updatedQuestion });
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};
