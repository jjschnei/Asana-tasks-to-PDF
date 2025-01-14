"use client";

import React, { useState } from 'react';
import { FileText, Download, AlertCircle } from 'lucide-react';
import AsanaAuth from './AsanaAuth';
import AsanaTaskSelector from './AsanaTaskSelector';

const AsanaPDFConverter = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [introText, setIntroText] = useState('');
  const [accessToken, setAccessToken] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);

  const handleAuthComplete = (token) => {
    setAccessToken(token);
  };

  const handleTaskSelect = (tasks) => {
    setSelectedTasks(tasks);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generatePDF = async (taskData) => {
    setIsLoading(true);
    setError('');

    try {
      // Dynamically import jsPDF
      const jsPDFScript = document.createElement('script');
      jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.body.appendChild(jsPDFScript);

      jsPDFScript.onload = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add branded header
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, 210, 40, 'F');
        
        // Add company name
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text('Your Company Name', 20, 25);
        
        // Add divider line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(20, 45, 190, 45);
        
        // Reset text color for content
        doc.setTextColor(0, 0, 0);
        
        // Initialize starting position and page metrics
        let yPos = 75;
        const lineHeight = 7;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const maxY = pageHeight - margin;

        // Helper function to check and add new page if needed
        const checkPageBreak = (requiredSpace = lineHeight) => {
          if (yPos + requiredSpace > maxY) {
            doc.addPage();
            yPos = margin;
            // Reset header on new page
            doc.setFillColor(41, 128, 185);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.text('Your Company Name', 20, 25);
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(20, 45, 190, 45);
            doc.setTextColor(0, 0, 0);
            yPos = 75;
          }
        };
        
        // Add Introduction section if there's intro text
        if (introText.trim()) {
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('Introduction', 20, 55);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          const splitIntroText = doc.splitTextToSize(introText, 170);
          doc.text(splitIntroText, 20, 65);
          
          yPos += splitIntroText.length * lineHeight;
        }

        // Process each selected task
        selectedTasks.forEach((taskData, index) => {
          // Add page break if not the first task and content would overflow
          if (index > 0) {
            doc.addPage();
            yPos = 20;
          }

          // Add task title
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(20);
          doc.text(taskData.name || 'Untitled Task', 20, yPos);
          yPos += lineHeight * 2;
          
          // Reset font for body text
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          
          // Project & Section
          if (taskData.memberships?.[0]) {
            const membership = taskData.memberships[0];
            if (membership.project?.name) {
              doc.text(`Project: ${membership.project.name}`, 20, yPos);
              yPos += lineHeight;
            }
            if (membership.section?.name) {
              doc.text(`Section: ${membership.section.name}`, 20, yPos);
              yPos += lineHeight * 2;
            }
          }
          
          // Assignee
          if (taskData.assignee) {
            doc.text(`Assignee: ${taskData.assignee.name || 'Unassigned'}`, 20, yPos);
            yPos += lineHeight;
          }
          
          // Due date
          if (taskData.due_on) {
            doc.text(`Due Date: ${formatDate(taskData.due_on)}`, 20, yPos);
            yPos += lineHeight;
          }
          
          // Custom fields
          if (taskData.custom_fields && taskData.custom_fields.length > 0) {
            console.log('Processing custom fields for task:', taskData.name);
            taskData.custom_fields.forEach(field => {
              if (!field.name) {
                console.warn('Field missing name:', field);
                return;
              }
              
              let displayValue = field.display_value;
              if (displayValue === undefined || displayValue === null) {
                console.warn(`Missing display_value for field ${field.name}:`, field);
                // Fallback to other possible value fields
                displayValue = field.enum_value?.name 
                  || field.number_value?.toString() 
                  || field.text_value 
                  || 'No value';
              }
              
              doc.text(`${field.name}: ${displayValue}`, 20, yPos);
              yPos += lineHeight;
            });
            yPos += lineHeight;
          } else {
            console.log('No custom fields found for task:', taskData.name);
          }
          
          // Description
          if (taskData.notes) {
            doc.text('Description:', 20, yPos);
            yPos += lineHeight;
            
            const splitText = doc.splitTextToSize(taskData.notes, 170);
            doc.text(splitText, 20, yPos);
          }
        });
        
        // Save the PDF
        doc.save(`asana-tasks-${new Date().getTime()}.pdf`);
        setIsLoading(false);
      };

      jsPDFScript.onerror = () => {
        throw new Error('Failed to load PDF generation library');
      };

    } catch (err) {
      setError('Error generating PDF. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl space-y-6">
      {/* Main Title */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <FileText className="h-6 w-6" />
          Asana Task PDF Converter
        </h1>
      </div>

      {/* Authentication Component */}
      <AsanaAuth onAuthComplete={handleAuthComplete} />

      {accessToken && (
        <>
          {/* Task Selector */}
          <AsanaTaskSelector 
            accessToken={accessToken}
            onTaskSelect={handleTaskSelect}
          />

          {/* Introduction Text Input */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <label 
                htmlFor="intro-text" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Introduction Text
              </label>
              <textarea
                id="intro-text"
                value={introText}
                onChange={(e) => setIntroText(e.target.value)}
                placeholder="Enter introduction text to be added to the PDF..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
              />
            </div>

            {/* Generate PDF Button */}
            <button 
              onClick={() => selectedTasks.length > 0 && generatePDF(selectedTasks)}
              disabled={isLoading || selectedTasks.length === 0}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                (isLoading || selectedTasks.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Download className="h-4 w-4" />
              {isLoading ? 'Generating PDF...' : 'Generate PDF'}
            </button>
            
            {/* Error Message */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AsanaPDFConverter;