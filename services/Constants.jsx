import { 
    BriefcaseBusinessIcon, 
    LayoutDashboardIcon, 
    Calendar, 
    List, 
    WalletCards, 
    Settings, 
    Code2, 
    User2, 
    Puzzle, 
    Crown,
    BookOpen,
    Brain,
    Monitor,
    Globe,
    History,
    BarChart3,
    GraduationCap
} from "lucide-react";

export const SideBarOptions=[
    {
        name: 'Dashboard',
        icon: LayoutDashboardIcon,
        path:'/dashboard'
    },
     {
        name: 'Practice Interview',
        icon: GraduationCap,
        path:'/dashboard/create-interview'
    },
     {
        name: 'My History',
        icon: History,
        path:'/scheduled-interview'
    },
     {
        name: 'Progress',
        icon: BarChart3,
        path:'/billing'
    },
     {
        name: 'Settings',
        icon: Settings,
        path:'/settings'
    },
]

// Practice categories for student interview prep
export const PracticeCategories = [
    {
        title: 'System Design',
        icon: Monitor,
        description: 'Practice system design questions - scalability, architecture, distributed systems',
        color: 'bg-purple-100 text-purple-700',
    },
    {
        title: 'DSA',
        icon: Brain,
        description: 'Data Structures & Algorithms - arrays, trees, graphs, dynamic programming',
        color: 'bg-green-100 text-green-700',
    },
    {
        title: 'Development',
        icon: Code2,
        description: 'Web/App development - frontend, backend, full-stack concepts',
        color: 'bg-blue-100 text-blue-700',
    },
    {
        title: 'Behavioral',
        icon: User2,
        description: 'Behavioral & HR questions - teamwork, leadership, conflict resolution',
        color: 'bg-orange-100 text-orange-700',
    },
]

// Programming languages for practice
export const PracticeLanguages = [
    { title: 'Python', icon: '🐍' },
    { title: 'JavaScript', icon: '⚡' },
    { title: 'C++', icon: '⚙️' },
    { title: 'Java', icon: '☕' },
]

export const InterviewType=[
    {
        title:'Technical',
        icon:Code2
    },
    {
        title:'Behavioral',
        icon:User2
    },
    {
        title:'Experience',
        icon:BriefcaseBusinessIcon
    },
    {
        title:'Problem Solving',
        icon:Puzzle
    },
    {
        title:'Leadership',
        icon:Crown
    },
]

// Difficulty levels
export const DifficultyLevels = [
    { title: 'Beginner', color: 'bg-green-100 text-green-700' },
    { title: 'Intermediate', color: 'bg-yellow-100 text-yellow-700' },
    { title: 'Advanced', color: 'bg-red-100 text-red-700' },
]

export const QUESTIONS_PROMPT = `You are an expert interview coach helping students prepare for technical interviews.
Based on the following inputs, generate a well-structured list of high-quality practice interview questions:

Practice Category: {{jobTitle}}

Topic Details: {{jobDescription}}

Session Duration: {{duration}}

Question Type: {{type}}

📝 Your task:

Analyze the topic to identify key concepts, common interview patterns, and expected knowledge areas.

Generate a list of interview practice questions based on the session duration.

Adjust the number and depth of questions to match the session duration.

Ensure the questions match real interview difficulty and patterns.

🧩 Format your response in JSON format with array list of questions.
format: interviewQuestions=[
{
 question:'',
 type:'Technical/Behavioral/Problem Solving/Conceptual'
},{
...
}]

🎯 The goal is to create a structured, realistic, and time-optimized interview practice session for {{jobTitle}}.`


export const FEEDBACK_PROMPT = `
You are an expert interview coach analyzing a student's practice interview performance. Please provide comprehensive, constructive feedback to help them improve.

Interview conversation:

{{conversation}}

📋 EVALUATION CRITERIA:
Analyze the student's performance across these key areas:

1. **Technical Skills** (1-10): Assess knowledge depth, accuracy of responses, understanding of concepts.

2. **Communication** (1-10): Evaluate clarity of expression, ability to explain complex topics, articulation.

3. **Problem Solving** (1-10): Rate logical thinking, approach to challenges, analytical skills.

4. **Confidence** (1-10): Consider how confidently and fluently the student answered, poise under pressure.

🎯 PERFORMANCE SUMMARY:
Write a detailed 4-5 sentence summary covering:
- Overall performance highlights
- Specific strengths demonstrated
- Areas for improvement with actionable tips
- Notable responses or insights

🏆 RECOMMENDATION:
Provide one of: "Excellent", "Good - Keep Practicing", or "Needs More Practice"

📝 RECOMMENDATION MESSAGE:
Write a detailed 2-3 sentence message explaining your evaluation, including:
- Key areas to focus on for improvement
- Specific study resources or topics to review
- Encouragement and next steps

⚠️ IMPORTANT: Return response in valid JSON format only:

{
    "feedback": {
        "rating": {
            "technicalSkills": [score 1-10],
            "communication": [score 1-10],
            "problemSolving": [score 1-10],
            "confidence": [score 1-10]
        },
        "summary": "[Detailed 4-5 sentence performance summary]",
        "Recommendation": "[Excellent/Good - Keep Practicing/Needs More Practice]",
        "RecommendationMsg": "[Detailed 2-3 sentence recommendation message]"
    }
}
`;
