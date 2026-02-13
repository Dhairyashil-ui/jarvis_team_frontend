import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { generateMemberLink } from "../utils/UrlUtils";

const TeamRegistrationForm = () => {
  const [formData, setFormData] = useState({
    teamName: '',
    problemStatement: '',
    hackathonTime: '',
    teamLeaderName: '',
    teamLeaderEmail: '',
    teamLeaderPhone: '',
    numberOfMembers: 1
  });

  const [members, setMembers] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedLinks, setGeneratedLinks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const validateForm = () => {
    if (currentStep === 1) {
      return formData.teamName && formData.problemStatement && formData.hackathonTime;
    } else if (currentStep === 2) {
      return formData.teamLeaderName && formData.teamLeaderEmail && 
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

  const saveToJarvisMemory = async (teamData) => {
    try {
      console.log('Sending team data to backend:', teamData);
            
      const apiUrl = 'https://jarvis-projectmanager.onrender.com';
      // const apiUrl = 'http://localhost:5002';

      console.log('Using API base URL:', apiUrl);
            
      // Send team data to backend API to store in Jarvis memory
      const response = await fetch(`${apiUrl}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_name: teamData.teamName,
          problem_statement: teamData.problemStatement,
          duration_hours: parseInt(teamData.hackathonTime) || 24,
          members: teamData.members.map(member => ({
            name: member.name,
            email: member.email,
            phone: member.phone || '',
            role: member.role || 'Team Member',
            skills: Array.isArray(member.skills) ? member.skills : (member.skills ? member.skills.split(',').map(skill => skill.trim()).filter(skill => skill) : [])
          }))
        }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Memory save result:', result);
      return result;
    } catch (error) {
      console.error('Error saving to Jarvis memory:', error);
      throw error; // Re-throw to be handled by caller
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare team data
    const teamData = {
      teamName: formData.teamName,
      problemStatement: formData.problemStatement,
      hackathonTime: formData.hackathonTime,
      teamLeader: {
        name: formData.teamLeaderName,
        email: formData.teamLeaderEmail,
        phone: formData.teamLeaderPhone
      },
      members: [
        // Add team leader as first member
        {
          name: formData.teamLeaderName,
          email: formData.teamLeaderEmail,
          phone: formData.teamLeaderPhone,
          role: 'Team Leader',
          skills: []
        },
        // Add other members
        ...members.map(member => ({
          name: member.name,
          email: member.email,
          phone: member.phone || '',
          role: member.role || 'Team Member',
          skills: Array.isArray(member.skills) ? member.skills : (member.skills ? member.skills.split(',').map(skill => skill.trim()).filter(skill => skill) : [])
        }))
      ],
      registrationTimestamp: new Date().toISOString(),
      status: 'active'
    };
    
    try {
      // Save to Jarvis memory and wait for completion
      const result = await saveToJarvisMemory(teamData);
      
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
    
    // Process actual tokens from backend
    setTimeout(() => {
      // Map tokens to members
      const links = members.map((member, index) => {
        const tokenData = memberTokens[index + 1]; // +1 because team leader is index 0
        const token = tokenData ? tokenData.token : null;
        
        return {
          memberId: member.id,
          memberName: member.name,
          role: tokenData ? tokenData.role : member.role,
          link: token ? generateMemberLink(token) : '#'
        };
      });
      
      // Add team leader link
      const leaderTokenData = memberTokens[0];
      if (leaderTokenData) {
        links.unshift({
          memberId: 'leader',
          memberName: formData.teamLeaderName,
          role: 'Team Leader',
          link: generateMemberLink(leaderTokenData.token)
        });
      }
      
      setGeneratedLinks(links);
      setIsGenerating(false);
      setCurrentStep(3); // Show generated links
    }, 500); // Fast processing since we have actual tokens
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
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
          className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700"
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-2">
            Team Registration - Step 1
          </motion.h2>
          <motion.p variants={itemVariants} className="text-gray-400 mb-8">
            Tell us about your hackathon team and project
          </motion.p>

          <form onSubmit={(e) => { e.preventDefault(); setCurrentStep(2); }} className="space-y-6">
            <motion.div variants={itemVariants}>
              <label className="block text-gray-300 mb-2">Team Name *</label>
              <input
                type="text"
                name="teamName"
                value={formData.teamName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your team name"
                required
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-gray-300 mb-2">Problem Statement *</label>
              <textarea
                name="problemStatement"
                value={formData.problemStatement}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the problem your team is solving..."
                required
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block text-gray-300 mb-2">Hackathon Duration (hours) *</label>
              <input
                type="number"
                name="hackathonTime"
                value={formData.hackathonTime}
                onChange={handleInputChange}
                min="1"
                max="168"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter duration in hours"
                required
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex justify-between pt-4">
              <div></div>
              <button
                type="submit"
                disabled={!validateForm()}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                Next: Add Team Members
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
          className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700"
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-2">
            Team Members - Step 2
          </motion.h2>
          <motion.p variants={itemVariants} className="text-gray-400 mb-8">
            Add your team leader and members
          </motion.p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Team Leader Section */}
            <motion.div variants={itemVariants} className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
              <h3 className="text-xl font-semibold text-white mb-4">Team Leader</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="teamLeaderName"
                    value={formData.teamLeaderName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Team leader's full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Email *</label>
                  <input
                    type="email"
                    name="teamLeaderEmail"
                    value={formData.teamLeaderEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="team.leader@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="teamLeaderPhone"
                    value={formData.teamLeaderPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Number of Additional Members</label>
                  <input
                    type="number"
                    name="numberOfMembers"
                    value={formData.numberOfMembers}
                    onChange={handleInputChange}
                    min="0"
                    max="10"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </motion.div>

            {/* Additional Members Section */}
            {members.length > 0 && (
              <motion.div variants={itemVariants}>
                <h3 className="text-xl font-semibold text-white mb-4">Team Members</h3>
                <div className="space-y-6">
                  {members.map((member) => (
                    <div key={member.id} className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-300 mb-2">Member Name *</label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Member's full name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2">Email *</label>
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) => handleMemberChange(member.id, 'email', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="member@email.com"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2">Phone Number</label>
                          <input
                            type="tel"
                            value={member.phone}
                            onChange={(e) => handleMemberChange(member.id, 'phone', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 mb-2">Role</label>
                          <input
                            type="text"
                            value={member.role}
                            onChange={(e) => handleMemberChange(member.id, 'role', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Frontend Developer, Designer, etc."
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-gray-300 mb-2">Skills (comma separated)</label>
                          <input
                            type="text"
                            value={member.skills}
                            onChange={(e) => handleMemberChange(member.id, 'skills', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="React, Python, UI/UX, etc."
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
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {isGenerating ? 'Generating Links...' : 'Complete Registration'}
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
          className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700"
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-2">
            Registration Complete! 🎉
          </motion.h2>
          <motion.p variants={itemVariants} className="text-gray-400 mb-8">
            Here are your personal member links. Share these with your team members.
          </motion.p>

          <motion.div variants={itemVariants} className="space-y-4">
            {generatedLinks.map((link, index) => (
              <div key={index} className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{link.memberName}</h3>
                    <p className="text-gray-400">{link.role}</p>
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-2">Personal Link:</p>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={link.link}
                          readOnly
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-l-lg text-gray-300 text-sm"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(link.link)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg transition-colors"
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
                setCurrentStep(1);
                setFormData({
                  teamName: '',
                  problemStatement: '',
                  hackathonTime: '',
                  teamLeaderName: '',
                  teamLeaderEmail: '',
                  teamLeaderPhone: '',
                  numberOfMembers: 1
                });
                setMembers([]);
                setGeneratedLinks([]);
              }}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all transform hover:scale-105"
            >
              Register Another Team
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default TeamRegistrationForm;