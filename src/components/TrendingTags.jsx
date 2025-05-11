import React from 'react';

const TrendingTags = () => {
    // In a real application, these would come from an API
    const trendingTags = [
        { name: 'DigitalArt', count: 1234 },
        { name: 'Poetry', count: 856 },
        { name: 'Music', count: 2345 },
        { name: 'Photography', count: 1890 },
        { name: 'Writing', count: 1456 },
    ];

    return (
        <div className="bg-card-dark rounded-2xl p-6 shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Trending Tags</h2>
            <ul className="space-y-2">
                {trendingTags.map((tag) => (
                    <li key={tag.name}>
                        <a 
                            href={`/tag/${tag.name}`} 
                            className="text-pink-400 hover:text-pink-300 flex justify-between items-center transition-colors"
                        >
                            <span>#{tag.name}</span>
                            <span className="text-sm text-gray-400">{tag.count} posts</span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TrendingTags; 