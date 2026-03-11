import React from 'react'
import { Monitor, Brain, Code2, User2 } from 'lucide-react'
import Link from 'next/link'

const categories = [
    {
        title: 'System Design',
        icon: Monitor,
        description: 'Scalability, architecture & distributed systems',
        color: 'bg-purple-50 border-purple-200',
        iconColor: 'text-purple-600 bg-purple-100',
        query: 'System Design',
    },
    {
        title: 'DSA',
        icon: Brain,
        description: 'Data Structures & Algorithms practice',
        color: 'bg-green-50 border-green-200',
        iconColor: 'text-green-600 bg-green-100',
        query: 'DSA',
    },
    {
        title: 'Development',
        icon: Code2,
        description: 'Frontend, backend & full-stack questions',
        color: 'bg-blue-50 border-blue-200',
        iconColor: 'text-blue-600 bg-blue-100',
        query: 'Development',
    },
    {
        title: 'Behavioral',
        icon: User2,
        description: 'HR, teamwork & communication questions',
        color: 'bg-orange-50 border-orange-200',
        iconColor: 'text-orange-600 bg-orange-100',
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
                        className={`border rounded-xl p-5 flex flex-col gap-3 cursor-pointer hover:shadow-lg transition-all ${cat.color}`}
                    >
                        <div className={`p-3 rounded-lg h-12 w-12 flex items-center justify-center ${cat.iconColor}`}>
                            <cat.icon className='h-6 w-6'/>
                        </div>
                        <h2 className='font-bold'>{cat.title}</h2>
                        <p className='text-gray-500 text-sm'>{cat.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default CreateOptions