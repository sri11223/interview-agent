import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import QuestionListContainer from './QuestionListContainer';
import { supabase } from '@/services/supabaseClient';
import { useUser } from '@/app/provider';

function QuestionList({formData, onFinish}) {
    const [loading, setLoading] = useState(false);
    const [QuestionList, setQuestionList] = useState([]);
    const [saving, setSaving] = useState(false);
    const { user } = useUser(); // Get user from context
    
    // Simple function to save interview data (no SQL needed!)
    const handleFinish = async () => {
        setSaving(true);
        
        try {
            // Check if user is authenticated
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error('Session error:', sessionError);
                toast.error('Authentication error. Please login again.');
                setSaving(false);
                return;
            }
            
            if (!session || !session.user) {
                console.log('No active session found');
                toast.error('Please login to save interview data');
                setSaving(false);
                return;
            }
            
            const currentUser = user || session.user;
            const interviewId = crypto.randomUUID();
            
            // Debug: Check QuestionList format
            console.log('🔍 QuestionList Debug Info:', {
                length: QuestionList?.length || 0,
                type: typeof QuestionList,
                isArray: Array.isArray(QuestionList),
                sample: QuestionList?.slice(0, 2) || 'No questions',
                formData: {
                    jobPosition: formData.jobPosition,
                    duration: formData.duration,
                    type: formData.type
                }
            });
            
            // Ensure QuestionList is properly formatted
            const validQuestionsList = Array.isArray(QuestionList) ? QuestionList : [];
            if (validQuestionsList.length === 0) {
                console.warn('⚠️ No questions found! QuestionList:', QuestionList);
                toast.error('No questions to save. Please generate questions first.');
                setSaving(false);
                return;
            }
            
            // Prepare interview data
            const interviewData = {
                id: interviewId,
                job_position: formData.jobPosition || 'Not specified',
                job_description: formData.jobDescription || 'Not specified',
                interview_duration: formData.duration || '30 minutes',
                interview_type: formData.type || 'General',
                questions: validQuestionsList, // Use validated questions
                user_email: currentUser.email,
                user_name: currentUser.name || currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || 'Unknown',
                user_id: currentUser.id,
                created_at: new Date().toISOString(),
                status: 'draft',
                total_questions: validQuestionsList.length || 0
            };

            // Prepare interview data with all columns (using correct column names)
            const interviewTableData = {
                jobPosition: formData.jobPosition || 'Not specified',
                jobDescription: formData.jobDescription || 'Not specified', 
                duration: formData.duration || '30 minutes',
                type: Array.isArray(formData.type) ? formData.type.join(', ') : (formData.type || 'General'),
                questionList: validQuestionsList, // Correct column name: questionList (not questionsList)
                userEmail: currentUser.email,
                interview_id: interviewId
            };

            console.log('💾 Saving to Interviews table with questions:', {
                jobPosition: interviewTableData.jobPosition,
                duration: interviewTableData.duration,
                type: interviewTableData.type,
                userEmail: interviewTableData.userEmail,
                interview_id: interviewTableData.interview_id,
                questionList_count: interviewTableData.questionList.length,
                sample_questions: interviewTableData.questionList.slice(0, 2) // Show first 2 questions
            });
            
            // Save to the existing Interviews table
            const { data: interviewRecord, error: interviewError } = await supabase
                .from('Interviews')
                .insert([interviewTableData])
                .select();
            
            if (interviewError) {
                console.error('❌ Failed to save to Interviews table:', interviewError);
                console.log('❌ Full error details:', JSON.stringify(interviewError, null, 2));
                console.log('❌ Data that failed to insert:', JSON.stringify(interviewTableData, null, 2));
                throw new Error(`Failed to save interview: ${interviewError.message || 'Unknown database error'}`);
            }
            
            console.log('✅ Successfully saved to Interviews table with questions!');
            console.log('✅ Database record:', interviewRecord[0]);
            
            // Update the interviewData with the database ID
            interviewData.database_id = interviewRecord[0].id;
            interviewData.database_record = interviewRecord[0];
            
            // Save to localStorage as backup (since everything is now in database)
            try {
                const localInterviews = JSON.parse(localStorage.getItem('interviews') || '[]');
                localInterviews.push(interviewData);
                localStorage.setItem('interviews', JSON.stringify(localInterviews));
                
                const userInterviews = JSON.parse(localStorage.getItem(`interviews_${currentUser.email}`) || '[]');
                userInterviews.push(interviewData);
                localStorage.setItem(`interviews_${currentUser.email}`, JSON.stringify(userInterviews));
                
                console.log('💾 Interview data also saved to localStorage as backup');
            } catch (localError) {
                console.warn('⚠️ localStorage backup failed:', localError);
            }
            
            console.log('🎉 Interview saved successfully to Interviews table with all data!');
            toast.success(`Interview saved! Database ID: ${interviewRecord[0].id} with ${QuestionList.length} questions`);
            
            if (onFinish && typeof onFinish === 'function') {
                onFinish({ 
                    ...interviewData, 
                    saved_to: 'Interviews_table_complete',
                    database_record: interviewRecord[0]
                });
            }
            
            setSaving(false);
            
        } catch (saveError) {
            console.error('💥 Save error:', saveError);
            
            // Emergency fallback to localStorage only
            try {
                const fallbackData = {
                    id: crypto.randomUUID(),
                    job_position: formData.jobPosition || 'Not specified',
                    job_description: formData.jobDescription || 'Not specified',
                    interview_duration: formData.duration || '30 minutes',
                    interview_type: Array.isArray(formData.type) ? formData.type.join(', ') : (formData.type || 'General'),
                    questions: QuestionList,
                    user_email: user?.email || session?.user?.email || 'unknown@example.com',
                    created_at: new Date().toISOString(),
                    status: 'draft',
                    database_error: saveError.message || 'Database connection failed',
                    fallback_storage: true
                };
                
                const existingInterviews = JSON.parse(localStorage.getItem('interviews') || '[]');
                existingInterviews.push(fallbackData);
                localStorage.setItem('interviews', JSON.stringify(existingInterviews));
                
                console.log('💾 Emergency save to localStorage completed');
                toast.error(`Database save failed. Saved locally instead. Error: ${saveError.message || 'Connection issue'}`);
                
                if (onFinish && typeof onFinish === 'function') {
                    onFinish({ ...fallbackData, saved_to: 'localStorage_emergency' });
                }
            } catch (emergencyError) {
                console.error('💥 Even emergency save failed:', emergencyError);
                toast.error('Failed to save interview data. Please check your connection and try again.');
            }
            
            setSaving(false);
        }
    };
    
    const GenerateQuestionList = async() => {

        setLoading(true);
        try {
            const result = await axios.post('/api/ai-model', {
                ...formData
            });
            
            console.log('Full API Response:', result);
            console.log('Response data:', result.data);
            console.log('Response status:', result.status);
            
            // Check if the API request was successful
            if (result.status !== 200) {
                console.error('API request failed with status:', result.status);
                toast('Server Error: Failed to generate questions');
                setLoading(false);
                return;
            }
            
            // Check if the response has the expected structure
            if (!result.data || result.data.success === false) {
                console.error('API returned error:', result.data?.error || 'Unknown error');
                toast(result.data?.error || 'Failed to generate questions');
                setLoading(false);
                return;
            }
            
            const Content = result.data.content;
            
            if (!Content || typeof Content !== 'string') {
                console.error('Invalid content received:', Content);
                console.error('Full response data:', result.data);
                toast('Invalid response from server - no content received');
                setLoading(false);
                return;
            }
            
            console.log('Raw content:', Content);
            const FINAL_CONTENT = Content.replace('```json','').replace('```','').replace(/\\n/g,'\n').trim();
            console.log('Cleaned content:', FINAL_CONTENT);
            
            try {
                const parsedData = JSON.parse(FINAL_CONTENT);
                console.log('Parsed data:', parsedData);
                
                // Extract the questions array from the response
                let questionsArray = parsedData;
                if (parsedData.interviewQuestions) {
                    questionsArray = parsedData.interviewQuestions;
                }
                
                if (!Array.isArray(questionsArray)) {
                    console.error('Expected array but got:', typeof questionsArray, questionsArray);
                    toast('Invalid question format received');
                    setLoading(false);
                    return;
                }
                
                setQuestionList(questionsArray);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                console.log('Failed content:', FINAL_CONTENT);
                toast('Failed to parse questions from AI response');
                setLoading(false);
                return;
            }
            
            setLoading(false);
        }
        catch(e) {
            console.error('Error in GenerateQuestionList:', e);
            console.error('Error details:', e.response?.data || e.message);
            
            if (e.response?.status === 500) {
                toast('Server Error: Please try again later');
            } else if (e.response?.status === 401) {
                toast('Authentication Error: Please check your API key');
            } else if (e.code === 'NETWORK_ERROR') {
                toast('Network Error: Please check your internet connection');
            } else {
                toast(e.response?.data?.error || e.message || 'An unexpected error occurred');
            }
            
            setLoading(false);
        }
    }
    
    useEffect(() => {
        if(formData) {
            GenerateQuestionList();
        }
    }, [formData])
    

    return(
        <div>
            {loading && (
                <div className='p-5 bg-blue-50 rounded-xl border border-primary flex gap-5 items-center'>
                    <Loader2Icon className='animate-spin'/>
                    <div>
                        <h2 className='font-medium'>Generating Interview Questions</h2>
                        <p className='text-primary'>Our AI is crafting personalized questions based on your job position</p>
                    </div>
                </div>
            )}
            
            {/* Use QuestionListContainer to display questions */}
            {!loading && QuestionList?.length > 0 && (
                <div className='mt-5'>
                    <QuestionListContainer QuestionList={QuestionList} />
                </div>
            )}
            
            {/* Show Finish button when questions are loaded */}
            {!loading && QuestionList?.length > 0 && (
                <div className='mt-5 flex justify-end'>
                    <Button 
                        onClick={handleFinish} 
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {saving ? (
                            <>
                                <Loader2Icon className='animate-spin mr-2 h-4 w-4' />
                                Saving...
                            </>
                        ) : (
                            'Finish & Continue'
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}

export default QuestionList