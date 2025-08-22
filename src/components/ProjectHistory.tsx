import React, { useState, useEffect } from 'react';

interface Project {
  id: string;
  name: string;
  createdAt: string;
  script: string;
  analysis: string;
  images: any[];
  status: 'draft' | 'completed';
}

const ProjectHistory: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const savedProjects = localStorage.getItem('aiVideoCreatorProjects');
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    }
  };

  const deleteProject = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      localStorage.setItem('aiVideoCreatorProjects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="project-history">
      <h2>📁 Project History</h2>
      
      {projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects saved yet. Create your first video project!</p>
        </div>
      ) : (
        <div className="projects-list">
          {projects.map((project) => (
            <div key={project.id} className="project-item">
              <div className="project-info">
                <h4>{project.name}</h4>
                <p>Created: {formatDate(project.createdAt)}</p>
                <p>Status: {project.status}</p>
                <p>Images: {project.images.length}</p>
              </div>
              <div className="project-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => deleteProject(project.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ProjectHistory;
