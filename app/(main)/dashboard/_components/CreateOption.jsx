import React from 'react'
import { Monitor, Brain, Code2, User2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const categories = [
    {
        title: 'System Design',
        icon: Monitor,
        description: 'Scalability, architecture & distributed systems',
        tags: ['Load Balancing', 'Caching', 'Microservices'],
        color: 'border-purple-200 hover:border-purple-500 hover:shadow-purple-100',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        tagWrapper: 'bg-purple-50 text-purple-700',
        query: 'System Design',
    },
    {
        title: 'DSA',
        icon: Brain,
        description: 'Arrays, Trees, Graphs, DP & Algorithm patterns',
        tags: ['Two Pointers', 'Binary Search', 'Dynamic Programming'],
        color: 'border-green-200 hover:border-green-500 hover:shadow-green-100',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        tagWrapper: 'bg-green-50 text-green-700',
        query: 'DSA',
    },
    {
        title: 'Development',
        icon: Code2,
        description: 'JavaScript, React, Node.js & full-stack concepts',
        tags: ['React Hooks', 'Node.js', 'REST APIs'],
        color: 'border-blue-200 hover:border-blue-500 hover:shadow-blue-100',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        tagWrapper: 'bg-blue-50 text-blue-700',
        query: 'Development',
    },
    {
        title: 'Behavioral',
        icon: User2,
        description: 'Leadership, teamwork & conflict resolution',
        tags: ['STAR Method', 'Teamwork', 'Leadership'],
        color: 'border-orange-200 hover:border-orange-500 hover:shadow-orange-100',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        tagWrapper: 'bg-orange-50 text-orange-700',
        query: 'Behavioral',
    },
]

function CreateOptions(){
    return(
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {categories.map((cat) => (
                <Link 
                    key={cat.title}
                    href={`/dashboard/create-interview?category=${encodeURIComponent(cat.query)}`}
                    className={`bg-white group border rounded-2xl p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${cat.color}`}
                >
                    {/* Background glow effect on hover */}
                    <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 ${cat.iconBg} rounded-full -mr-10 -mt-10 pointer-events-none`}></div>

                    <div className='flex items-center justify-between mb-4 relative z-10'>
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${cat.iconBg} ${cat.iconColor} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            <cat.icon className='w-7 h-7'/>
                        </div>
                        <ArrowRight className={`w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 ${cat.iconColor} transition-all duration-300`} />
                    </div>
                    
                    <div className="relative z-10">
                        <h3 className='text-xl font-extrabold text-gray-900 mb-2'>{cat.title}</h3>
                        <p className='text-gray-500 text-sm leading-relaxed mb-5'>{cat.description}</p>
                    </div>

                    <div className='flex flex-wrap gap-2 mt-auto relative z-10'>
                        {cat.tags.map(tag => (
                            <span key={tag} className={`text-xs font-semibold px-2.5 py-1 rounded-md ${cat.tagWrapper}`}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </Link>
            ))}
        </div>
    )
}

export default CreateOptions