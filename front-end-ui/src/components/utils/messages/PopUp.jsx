import React, { useEffect } from 'react';

export default function PopUp({ message, onClose }) {
    useEffect(()=>{
        console.log("PopUp message here");
    })
    return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
                <p className="text-lg text-gray-800 mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
