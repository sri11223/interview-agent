import React from 'react'
import { Monitor, Brain, Code2, User2 } from 'lucide-react'
import Link from 'next/link'

const categories = [
    {
        title: 'System Design',
        icon: Monitor,
        description: 'Scalability, architecture & distributed systems',
        tags: ['Load Balancing', 'Caching', 'Microservices'],
        color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
        iconColor: 'text-purple-600 bg-purple-100',
        tagColor: 'bg-purple-100 text-purple-600',
        query: 'System Design',
    },
    {
        title: 'DSA',
        icon: Brain,
        description: 'Arrays, Trees, Graphs, DP & Algorithm patterns',
        tags: ['Two Pointers', 'Binary Search', 'Dynamic Programming'],
        color: 'bg-green-50 border-green-200 hover:border-green-400',
        iconColor: 'text-green-600 bg-green-100',
        tagColor: 'bg-green-100 text-green-600',
        query: 'DSA',
    },
    {
        title: 'Development',
        icon: Code2,
        description: 'JavaScript, React, Node.js & full-stack concepts',
        tags: ['React Hooks', 'Node.js', 'REST APIs'],
        color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
        iconColor: 'text-blue-600 bg-blue-100',
        tagColor: 'bg-blue-100 text-blue-600',
        query: 'Development',
    },
    {
        title: 'Behavioral',
        icon: User2,
        description: 'Leadership, teamwork & conflict resolution',
        tags: ['STAR Method', 'Teamwork', 'Leadership'],
        color: 'bg-orange-50 border-orange-200 hover:border-orange-400',
        iconColor: 'text-orange-600 bg-orange-100',
        tagColor: 'bg-orange-100 text-orange-600',
        query: 'Behavioral',
    },
]

function CreateOptions(){
    return(
        <div>
            <h2 className='font-bold text-lg mb-3'>Start Practicing</h2>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                {categories.map((cat) => (
                    <Link 
                        key={cat.title}
                        href={`/dashboard/create-interview?category=${encodeURIComponent(cat.query)}`}
                        className={`border-2 rounded-xl p-5 flex flex-col gap-3 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all ${cat.color}`}
                    >
                        <div className={`p-3 rounded-lg h-12 w-12 flex items-center justify-center ${cat.iconColor}`}>
                            <cat.icon className='h-6 w-6'/>
                        </div>
                        <h2 className='font-bold'>{cat.title}</h2>
                        <p className='text-gray-500 text-sm'>{cat.description}</p>
                        <div className='flex flex-wrap gap-1.5 mt-auto'>
                            {cat.tags.map(tag => (
                                <span key={tag} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cat.tagColor}`}>{tag}</span>
                            ))}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default CreateOptions