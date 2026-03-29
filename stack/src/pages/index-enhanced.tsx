// pages/index.tsx
// Enhanced home page with dynamic translation support

import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import Mainlayout from "../layout/Mainlayout";
import { useAuth } from "../lib/AuthContext";
import axiosInstance from "../lib/axiosinstance";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDynamicTranslation, DynamicText } from "../hooks/useDynamicTranslation";

// Sample questions data - in real app this would come from API
const staticQuestions = [
  {
    id: 1,
    votes: 0,
    answers: 0,
    views: 3,
    title: "Mouse Cursor in 16-bit Assembly (NASM) Overwrites Screen Content in VGA Mode 0x12",
    content: "I'm developing a PS/2 mouse driver in 16-bit assembly (NASM) for a custom operating system running in VGA mode 0x12 (640x480, 16 colors). The driver initializes the mouse, handles mouse events, and ...",
    tags: ["assembly", "operating-system", "driver", "osdev"],
    author: "PR0X",
    authorId: 1,
    authorRep: 3,
    timeAgo: "2 mins ago",
  },
  {
    id: 2,
    votes: 0,
    answers: 1,
    views: 12,
    title: "Template specialization inside a template class using class template parameters",
    content: "template<typename TypA, typename TypX> struct MyClass { using TypAlias = TypA<TypX>; // error: 'TypA' is not a template [-Wtemplate-body] }; MyClass is very often specialized like ...",
    tags: ["c++", "templates"],
    author: "Felix.leg",
    authorId: 2,
    authorRep: 799,
    timeAgo: "11 mins ago",
  },
  {
    id: 3,
    votes: -2,
    answers: 0,
    views: 13,
    title: "How can i block user with middleware?",
    content: "The problem I am trying to create a complete user login form in NextJS and I want to block the user to go to other pages without a login process before. So online i found that one of the most complete ...",
    tags: ["node.js", "forms", "authentication", "next.js", "middleware"],
    author: "JohnDoe",
    authorId: 3,
    authorRep: 1,
    timeAgo: "25 mins ago",
  }
];

interface Question {
  id: number;
  votes: number;
  answers: number;
  views: number;
  title: string;
  content: string;
  tags: string[];
  author: string;
  authorId: number;
  authorRep: number;
  timeAgo: string;
}

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { tSync, locale } = useDynamicTranslation('common');
  
  // Use static questions for now (dynamic translation can be added later)
  const [questions, setQuestions] = useState(staticQuestions);
  const [isTranslating, setIsTranslating] = useState(false);

  const [questionsList, setQuestionsList] = useState<Question[]>(staticQuestions);
  const [loading, setLoading] = useState(false);

  // Fetch questions from API (placeholder function)
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // In real app: const response = await axiosInstance.get('/api/questions');
      // setQuestionsList(response.data);
      setQuestionsList(questions);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAskQuestion = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    router.push('/ask/questions');
  };

  if (loading || isTranslating) {
    return (
      <Mainlayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {tSync('home.topQuestions')}
              </h1>
              <p className="text-gray-600">
                <DynamicText text="Find answers to your programming questions and help others solve their problems" />
              </p>
            </div>
            <Button onClick={handleAskQuestion} className="bg-blue-600 hover:bg-blue-700">
              {tSync('home.askQuestion')}
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-6">
            {['newest', 'active', 'bountied', 'unanswered'].map((filter) => (
              <button
                key={filter}
                className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
              >
                <DynamicText text={filter} />
                {filter === 'newest' && <span className="ml-2 text-gray-500">({questions.length})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.map((question) => (
            <article key={question.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex space-x-4">
                {/* Vote Stats */}
                <div className="flex flex-col items-center space-y-1 min-w-[60px]">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{question.votes}</div>
                    <div className="text-xs text-gray-500">
                      <DynamicText text="votes" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${question.answers > 0 ? 'text-green-600' : 'text-gray-700'}`}>
                      {question.answers}
                    </div>
                    <div className="text-xs text-gray-500">
                      <DynamicText text={question.answers === 1 ? 'answer' : 'answers'} />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{question.views}</div>
                    <div className="text-xs text-gray-500">
                      <DynamicText text="views" />
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <div className="flex-1">
                  <Link href={`/questions/${question.id}`}>
                    <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 mb-2 cursor-pointer">
                      {question.title}
                    </h3>
                  </Link>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {question.content}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {question.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {question.author.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Link href={`/users/${question.authorId}`} className="hover:text-blue-600">
                          {question.author}
                        </Link>
                        <span>•</span>
                        <span>{question.authorRep} reputation</span>
                        <span>•</span>
                        <span>
                          <DynamicText text="asked" /> {question.timeAgo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Empty State */}
        {questions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <DynamicText text="No questions found. Be the first to ask!" />
            </div>
            <Button onClick={handleAskQuestion} variant="outline">
              {tSync('home.askQuestion')}
            </Button>
          </div>
        )}

        {/* Load More */}
        {questions.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline" className="px-6">
              <DynamicText text="Load more questions" />
            </Button>
          </div>
        )}
      </div>

      {/* Translation Status Indicator */}
      {locale !== 'en' && (
        <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-blue-800">
              <DynamicText text="Dynamic translation active" />
            </span>
          </div>
        </div>
      )}
    </Mainlayout>
  );
};

export default HomePage;
