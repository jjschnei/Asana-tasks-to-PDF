"use client";

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const AsanaTaskSelector = ({ accessToken, onTaskSelect }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedFields, setSelectedFields] = useState({
    name: true,
    notes: true,
    assignee: true,
    due_date: true,
  });
  const [customFields, setCustomFields] = useState([]);
  const [selectedCustomFields, setSelectedCustomFields] = useState({});

  // Remove the useEffect for task selection updates since we're handling it in handleTaskToggle
  useEffect(() => {
    if (accessToken) {
      fetchProjects();
    }
  }, [accessToken]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('https://app.asana.com/api/1.0/projects', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProjects(data.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      const response = await fetch(`https://app.asana.com/api/1.0/projects/${projectId}/tasks?opt_fields=gid,name,notes,assignee.name,due_on,custom_fields,memberships.project.name,memberships.section.name,custom_fields.name,custom_fields.display_value,custom_fields.type,custom_fields.enum_value,custom_fields.enum_value.name,custom_fields.number_value,custom_fields.text_value,custom_fields.gid,custom_fields.display_value`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTasks(data.data);
      
      // Extract unique custom fields from tasks
      const uniqueCustomFields = new Set();
      data.data.forEach(task => {
        task.custom_fields?.forEach(field => {
          uniqueCustomFields.add(JSON.stringify({
            id: field.gid,
            name: field.name,
            type: field.type,
            // display_value: field.display_value,
          }));
        });
      });
      
      const customFieldsArray = Array.from(uniqueCustomFields).map(field => JSON.parse(field));
      setCustomFields(customFieldsArray);
      
      // Initialize selected custom fields
      const initialCustomFieldsState = {};
      customFieldsArray.forEach(field => {
        initialCustomFieldsState[field.id] = true;
      });
      setSelectedCustomFields(initialCustomFieldsState);
      
      setSelectedTasks([]); // Clear selected tasks when changing projects
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
    }
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    fetchTasks(project.gid);
  };

  const handleTaskToggle = (task) => {
    const taskId = task.gid;
    const newSelection = selectedTasks.includes(taskId)
      ? selectedTasks.filter(id => id !== taskId)
      : [...selectedTasks, taskId];
    
    setSelectedTasks(newSelection);

    // Create selected tasks data
    const selectedTasksData = tasks
      .filter(task => newSelection.includes(task.gid))
      .map(task => {
        console.log('Processing task:', task); // Debug log
        console.log('Task custom fields:', task.custom_fields); // Add this debug log
        return {
          gid: task.gid,
          name: selectedFields.name ? task.name : null,
          notes: selectedFields.notes ? task.notes : null,
          assignee: selectedFields.assignee ? task.assignee : null,
          due_on: selectedFields.due_date ? task.due_on : null,
          memberships: task.memberships,
          custom_fields: task.custom_fields?.filter(field => {
            const isSelected = selectedCustomFields[field.gid];
            console.log(`Custom field ${field.name}:`, { field, isSelected }); // Debug log
            return isSelected;
          })
        };
      });

    console.log('Selected tasks data:', selectedTasksData); // Debug log
    onTaskSelect(selectedTasksData);
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">Select Tasks</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Project Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Project List */}
        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
          {filteredProjects.map(project => (
            <div
              key={project.gid}
              className={`p-2 rounded-lg cursor-pointer ${
                selectedProject?.gid === project.gid
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleProjectSelect(project)}
            >
              {project.name}
            </div>
          ))}
        </div>

        {/* Field Selection */}
        <div className="border-t pt-4 mb-4">
          <h3 className="font-medium mb-2">Select Standard Fields:</h3>
          <div className="space-y-2">
            {Object.entries(selectedFields).map(([field, isSelected]) => (
              <label key={field} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() =>
                    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }))
                  }
                  className="rounded border-gray-300"
                />
                <span className="capitalize">{field.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
          
          {customFields.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Select Custom Fields:</h3>
              <div className="space-y-2">
                {customFields.map(field => (
                  <label key={field.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCustomFields[field.id]}
                      onChange={() =>
                        setSelectedCustomFields(prev => ({
                          ...prev,
                          [field.id]: !prev[field.id]
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="capitalize">{field.name}</span>
                    <span className="text-sm text-gray-500">({field.type})</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Task List */}
        {selectedProject && (
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Select Tasks:</h3>
            <div className="space-y-2">
              {tasks.map(task => (
                <label key={task.gid} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.gid)}
                    onChange={() => handleTaskToggle(task)}
                    className="rounded border-gray-300"
                  />
                  <span>{task.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsanaTaskSelector;