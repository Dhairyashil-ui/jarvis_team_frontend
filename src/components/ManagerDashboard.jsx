import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { generateMemberLink, getApiBaseUrl } from "../utils/UrlUtils";

const ManagerDashboard = () => {
    const [formData, setFormData] = useState({
        clientName: '',
        projectName: '',
        projectDescription: '',
        projectDurationDays: '7', // Default 7 days
        managerName: 'Dhairyashil Shinde',
        managerEmail: 'dhairyashil@agrimater.com', // Placeholder/Default
        managerPhone: '',
        numberOfMembers: 1
    });

    const [members, setMembers] = useState([]);
    const [currentStep, setCurrentStep] = useState(1);
    const [generatedLinks, setGeneratedLinks] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const validateForm = () => {
        if (currentStep === 1) {
            return formData.clientName && formData.projectName && formData.projectDescription && formData.projectDurationDays;
        } else if (currentStep === 2) {
            return formData.managerName &&
                members.every(member => member.name && member.email);
        }
        return true;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // When number of members changes, update the members array
        if (name === 'numberOfMembers') {
            const num = parseInt(value) || 1;
            const newMembers = [...members];

            // If increasing members, add empty slots
            while (newMembers.length < num) {
                newMembers.push({
                    id: newMembers.length + 1,
                    name: '',
                    email: '',
                    phone: '',
                    role: '',
                    skills: ''
                });
            }

            // If decreasing members, remove excess
            if (newMembers.length > num) {
                newMembers.splice(num);
            }

            setMembers(newMembers);
        }
    };

    const handleMemberChange = (memberId, field, value) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === memberId
                    ? { ...member, [field]: value }
                    : member
            )
        );
    };

    const saveToJarvisMemory = async (projectData) => {
        try {
            console.log('Sending project data to backend:', projectData);
            const apiUrl = getApiBaseUrl();
            console.log('Using API base URL:', apiUrl);

            // Send data to backend API (using existing /api/register endpoint for now)
            // We map "Project" concepts to the existing backend "Team/Hackathon" structure
            const response = await fetch(`${apiUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    team_name: `${projectData.clientName} - ${projectData.projectName}`, // Combine for backend
                    problem_statement: projectData.projectDescription,
                    duration_hours: (parseInt(projectData.projectDurationDays) || 7) * 24, // Convert Days to Hours
                    members: projectData.members.map(member => ({
                        name: member.name,
                        email: member.email,
                        phone: member.phone || '',
                        role: member.role || 'Team Member',
                        skills: Array.isArray(member.skills) ? member.skills : (member.skills ? member.skills.split(',').map(skill => skill.trim()).filter(skill => skill) : [])
                    }))
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('Memory save result:', result);
            return result;
        } catch (error) {
            console.error('Error saving to Jarvis memory:', error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prepare project data
        const projectData = {
            clientName: formData.clientName,
            projectName: formData.projectName,
            projectDescription: formData.projectDescription,
            projectDurationDays: formData.projectDurationDays,
            manager: {
                name: formData.managerName,
                email: formData.managerEmail,
                phone: formData.managerPhone
            },
            members: [
                // Manager as Team Leader
                {
                    name: formData.managerName,
                    email: formData.managerEmail,
                    phone: formData.managerPhone,
                    role: 'Manager',
                    skills: ['Project Management', 'Client Relations']
                },
                // Team Members
                ...members.map(member => ({
                    name: member.name,
                    email: member.email,
                    phone: member.phone || '',
                    role: member.role || 'Team Member',
                    skills: Array.isArray(member.skills) ? member.skills : (member.skills ? member.skills.split(',').map(skill => skill.trim()).filter(skill => skill) : [])
                }))
            ]
        };

        try {
            // Save and wait for completion
            const result = await saveToJarvisMemory(projectData);

            // Generate links with actual tokens from backend
            generateMemberLinks(result.members || []);
        } catch (error) {
            console.error('Registration failed:', error);
            alert(`Registration failed: ${error.message}`);
            return;
        }
    };

    const generateMemberLinks = (memberTokens = []) => {
        setIsGenerating(true);

        setTimeout(() => {
            // Map tokens to members (Team Leader/Manager is first in logic)

            // 1. Manager Link (Index 0 from backend usually)
            const managerTokenData = memberTokens[0];
            const allLinks = [];

            if (managerTokenData) {
                allLinks.push({
                    memberId: 'manager',
                    memberName: formData.managerName,
                    role: 'Manager',
                    link: generateMemberLink(managerTokenData.token)
                });
            }

            // 2. Member Links (Indices 1+)
            members.forEach((member, index) => {
                const tokenData = memberTokens[index + 1];
                const token = tokenData ? tokenData.token : null;

                allLinks.push({
                    memberId: member.id,
                    memberName: member.name,
                    role: tokenData ? tokenData.role : member.role,
                    link: token ? generateMemberLink(token) : '#'
                });
            });

            setGeneratedLinks(allLinks);
            setIsGenerating(false);
            setCurrentStep(3); // Show generated links
        }, 500);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {currentStep === 1 && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-xl"
                >
                    <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-2">
                        Agrimater Project Setup
                    </motion.h2>
                    <motion.p variants={itemVariants} className="text-gray-400 mb-8 border-b border-gray-700 pb-4">
                        Initialize a new client project and define parameters.
                    </motion.p>

                    <form onSubmit={(e) => { e.preventDefault(); setCurrentStep(2); }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div variants={itemVariants}>
                                <label className="block text-gray-300 mb-2 font-medium">Client Name *</label>
                                <input
                                    type="text"
                                    name="clientName"
                                    value={formData.clientName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g. Elon Musk"
                                    required
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <label className="block text-gray-300 mb-2 font-medium">Project Name *</label>
                                <input
                                    type="text"
                                    name="projectName"
                                    value={formData.projectName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g. Inventory System"
                                    required
                                />
                            </motion.div>
                        </div>

                        <motion.div variants={itemVariants}>
                            <label className="block text-gray-300 mb-2 font-medium">Project Description & Requirements *</label>
                            <textarea
                                name="projectDescription"
                                value={formData.projectDescription}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Describe the project scope, key deliverables, and client requirements..."
                                required
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className="block text-gray-300 mb-2 font-medium">Project Duration (Days) *</label>
                            <input
                                type="number"
                                name="projectDurationDays"
                                value={formData.projectDurationDays}
                                onChange={handleInputChange}
                                min="1"
                                max="365"
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="e.g. 14"
                                required
                            />
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={!validateForm()}
                                className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                            >
                                Next: Assign Team
                            </button>
                        </motion.div>
                    </form>
                </motion.div>
            )}

            {currentStep === 2 && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-xl"
                >
                    <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-2">
                        Team Allocation
                    </motion.h2>
                    <motion.p variants={itemVariants} className="text-gray-400 mb-8 border-b border-gray-700 pb-4">
                        Assign team members to <strong>{formData.projectName}</strong>.
                    </motion.p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Manager Section */}
                        <motion.div variants={itemVariants} className="bg-gray-700/40 rounded-xl p-6 border border-green-500/30">
                            <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center">
                                <span className="mr-2">👤</span> Project Manager
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-2">Manager Name</label>
                                    <input
                                        type="text"
                                        name="managerName"
                                        value={formData.managerName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2">Number of Team Members</label>
                                    <input
                                        type="number"
                                        name="numberOfMembers"
                                        value={formData.numberOfMembers}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="20"
                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Team Members Section */}
                        {members.length > 0 && (
                            <motion.div variants={itemVariants}>
                                <h3 className="text-xl font-semibold text-white mb-4">Team Members</h3>
                                <div className="space-y-6">
                                    {members.map((member, i) => (
                                        <div key={member.id} className="bg-gray-700/30 rounded-xl p-6 border border-gray-600 relative">
                                            <div className="absolute top-4 right-4 text-gray-500 font-bold">#{i + 1}</div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-gray-300 mb-2">Full Name *</label>
                                                    <input
                                                        type="text"
                                                        value={member.name}
                                                        onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                        placeholder="e.g. Aman Pokale"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-300 mb-2">Email *</label>
                                                    <input
                                                        type="email"
                                                        value={member.email}
                                                        onChange={(e) => handleMemberChange(member.id, 'email', e.target.value)}
                                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                        placeholder="amanpokale@agrimater.com"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-300 mb-2">Role</label>
                                                    <input
                                                        type="text"
                                                        value={member.role}
                                                        onChange={(e) => handleMemberChange(member.id, 'role', e.target.value)}
                                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                        placeholder="e.g. Frontend Dev"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-300 mb-2">Skills</label>
                                                    <input
                                                        type="text"
                                                        value={member.skills}
                                                        onChange={(e) => handleMemberChange(member.id, 'skills', e.target.value)}
                                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                        placeholder="React, Node.js..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <motion.div variants={itemVariants} className="flex justify-between pt-4">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={!validateForm() || isGenerating}
                                className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                            >
                                {isGenerating ? 'Initializing Project...' : 'Initialize Project'}
                            </button>
                        </motion.div>
                    </form>
                </motion.div>
            )}

            {currentStep === 3 && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-xl"
                >
                    <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-2">
                        Project Initialized Successfully! 🚀
                    </motion.h2>
                    <motion.p variants={itemVariants} className="text-gray-400 mb-8">
                        Project <strong>{formData.projectName}</strong> is ready. Share these access links with your team.
                    </motion.p>

                    <motion.div variants={itemVariants} className="space-y-4">
                        {generatedLinks.map((link, index) => (
                            <div key={index} className={`rounded-xl p-6 border ${link.role === 'Manager' ? 'bg-green-900/20 border-green-500/50' : 'bg-gray-700/30 border-gray-600'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-1">
                                            <h3 className="text-lg font-semibold text-white mr-2">{link.memberName}</h3>
                                            <span className={`text-xs px-2 py-1 rounded-full ${link.role === 'Manager' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                                                {link.role}
                                            </span>
                                        </div>

                                        <div className="mt-3">
                                            <p className="text-sm text-gray-500 mb-2">Secure Access Link:</p>
                                            <div className="flex items-center">
                                                <input
                                                    type="text"
                                                    value={link.link}
                                                    readOnly
                                                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-l-lg text-gray-300 text-sm font-mono"
                                                />
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(link.link)}
                                                    className={`px-4 py-2 text-white rounded-r-lg transition-colors ${link.role === 'Manager' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-gray-700">
                        <button
                            onClick={() => {
                                window.location.reload(); // Simple reset
                            }}
                            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all transform hover:scale-105"
                        >
                            Start New Project
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default ManagerDashboard;
