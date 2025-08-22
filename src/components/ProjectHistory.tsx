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

      <style jsx>{`
        .project-history {
          padding: 1rem;
        }

        .project-history h2 {
          margin-bottom: 1.5rem;
          color: #333;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          background: #f8f9fa;
          border-radius: 10px;
          color: #666;
        }

        .projects-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .project-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }

        .project-info h4 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .project-info p {
          margin: 0.25rem 0;
          color: #666;
          font-size: 0.875rem;
        }

        .project-actions {
          display: flex;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default ProjectHistory;
