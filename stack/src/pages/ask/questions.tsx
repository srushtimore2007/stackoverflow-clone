import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import Mainlayout from "../../layout/Mainlayout";
import { useAuth } from "../../lib/AuthContext";
import axiosInstance from "../../lib/axiosinstance";
import { Plus, X, ArrowRight, Crown } from "lucide-react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useSubscription } from "../../hooks/useSubscription";
import SubscriptionStatus from "../../components/SubscriptionStatus";
import { useTranslation } from "react-i18next";
import Link from "next/link";



const index = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, refetch: refetchSubscription } = useSubscription();
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  



  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    if (id === "tags") {
      const tagarray = value
        .split(/[s,]+/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      setFormData((prev) => ({ ...prev, tags: tagarray }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('askQuestion.pleaseLogin'));
      router.push("/auth/login");
      return;
    }

    // ✅ Check subscription limit before posting
    if (subscription && !subscription.canPostQuestion) {
      toast.error(t('askQuestion.dailyLimit'));
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axiosInstance.post("/api/questions/ask", {
        postquestiondata: {
          questiontitle: formData.title,
          questionbody: formData.body,
          questiontags: formData.tags,
          userposted: user.name,
          userid: user?._id,
        },
      });
      
      if (res.data.success) {
        toast.success(t('askQuestion.questionPosted'));
        // Refresh subscription status
        refetchSubscription();
        router.push("/");
      } else {
        toast.error(res.data.message || t('askQuestion.postFailed'));
      }
    } catch (error: any) {
      console.error("Post question error:", error);
      const errorMessage = error.response?.data?.message || t('askQuestion.somethingWrong');
      toast.error(errorMessage);
      
      // If limit reached, refresh subscription status
      if (errorMessage.includes("Daily question limit")) {
        refetchSubscription();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTag = newTag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmedTag] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag: string) => tag !== tagToRemove),
    });
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(e as any);
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl lg:text-2xl font-semibold mb-6">
          {t('askQuestion.title')}
        </h1>

        
        {/* ✅ Always Visible Upgrade Plan CTA */}
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">
                      {t('askQuestion.upgradePlanTitle')}
                    </h3>
                  </div>
                  <p className="text-purple-100 text-sm mb-1">
                    {t('askQuestion.upgradePlanSubtitle')}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-100 text-sm">
                      {t('askQuestion.currentPlan')}:
                    </span>
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors">
                      {subscription?.currentPlan || 'FREE'}
                    </Badge>
                  </div>
                </div>
                <Link href="/subscription">
                  <Button className="bg-white text-purple-600 hover:bg-purple-50 font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
                    {t('askQuestion.upgradePlan')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ Show subscription status */}
        {subscription && (
          <div className="mb-6">
            <SubscriptionStatus />
            {!subscription.canPostQuestion && subscription.currentPlan !== 'GOLD' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ {t('askQuestion.limitReached', { posted: subscription.questionsPostedToday, limit: subscription.dailyQuestionLimit })} 
                  {t('askQuestion.upgradePlan')}
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">
                {t('askQuestion.writingGood')}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-base font-semibold">
                  {t('askQuestion.title')}
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  {t('askQuestion.titleHelp')}
                </p>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={t('askQuestion.titlePlaceholder')}
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="body" className="text-base font-semibold">
                  {t('askQuestion.problemDetails')}
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  {t('askQuestion.problemHelp')}
                </p>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={handleChange}
                  placeholder={t('askQuestion.problemPlaceholder')}
                  className="min-h-32 lg:min-h-48 w-full"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="tags" className="text-base font-semibold">
                  {t('askQuestion.tags')}
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  {t('askQuestion.tagsHelp')}
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder={t('askQuestion.tagPlaceholder')}
                    className="w-full"
                    onKeyPress={handleTagInputKeyPress}
                    disabled={isSubmitting}
                  />
                  <Button
                    onClick={handleAddTag}
                    variant="outline"
                    size="sm"
                    type="button"
                    className="bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((tag: string) => {
                    return (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-orange-100 text-orange-800 flex items-center gap-1 hover:bg-orange-200 transition-colors"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-600 transition-colors disabled:opacity-50"
                          disabled={isSubmitting}
                          type="button"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Button 
                  type="submit" 
                  className="bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || subscription?.canPostQuestion === false}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('askQuestion.posting')}
                    </div>
                  ) : (
                    <>
                      {!subscription?.canPostQuestion ? t('askQuestion.limitReached') : t('askQuestion.reviewQuestion')}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </Mainlayout>
  );
};

export default index;
