import React from 'react';
import WelcomeContainer from './_components/WelcomeContainer';
import CreateOptions from './_components/CreateOption';
import LatestInterviewsList from './_components/LatestInterviewsList';

function Dashboard(){
    return(
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <WelcomeContainer/>
            
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Practice Hub</h2>
                </div>
                <CreateOptions/>
            </section>
            
            <section className="pt-4">
                <LatestInterviewsList/>
            </section>
        </div>
    )
}

export default Dashboard