import React, { useState } from 'react';

interface SaveProjectProps {
  script: string;
  analysis: string;
  images: any[];
  onSave: () => void;
}

const SaveProject: React.FC<SaveProjectProps> = ({ script, analysis, images, onSave }) => {
  const [projectName, setProjectName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    if (!script && !analysis && images.length === 0) {
      setError('No content to save. Please generate some content first.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const project = {
        id: Date.now().toString(),
        name: projectName.trim(),
        createdAt: new Date().toISOString(),
        script,
        analysis,
        images,
        status: 'draft' as const
      };

      // Get existing projects
      const existingProjects = localStorage.getItem('aiVideoCreatorProjects');
      const projects = existingProjects ? JSON.parse(existingProjects) : [];
      
      // Add new project
      projects.push(project);
      
      // Save back to localStorage
      localStorage.setItem('aiVideoCreatorProjects', JSON.stringify(projects));
      
      setSuccess('Project saved successfully!');
      setProjectName('');
      onSave();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasContent = script || analysis || images.length > 0;

  return (
    <div className="save-project">
      <h3>💾 Save Project</h3>
      
      {!hasContent && (
        <div className="no-content-warning">
          <p>No content to save yet. Generate a script, analysis, or images first.</p>
        </div>
      )}

      {hasContent && (
        <div className="save-form">
          <div className="form-group">
            <label htmlFor="projectName">Project Name</label>
            <input
              type="text"
              id="projectName"
              className="form-control"
              placeholder="Enter project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div className="content-summary">
            <h4>Content Summary:</h4>
            <ul>
              {script && <li>✅ Script ({script.length} characters)</li>}
              {analysis && <li>✅ Analysis ({analysis.length} characters)</li>}
              {images.length > 0 && <li>✅ Images ({images.length} generated)</li>}
            </ul>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <button
            className="btn"
            onClick={handleSave}
            disabled={isSaving || !projectName.trim() || !hasContent}
          >
            {isSaving ? (
              <>
                <div className="spinner"></div>
                Saving...
              </>
            ) : (
              '💾 Save Project'
            )}
          </button>
        </div>
      )}

      <style jsx>{`
        .save-project {
          background: #f8f9fa;
          border-radius: 10px;
          padding: 1.5rem;
          border: 1px solid #e9ecef;
          margin-top: 2rem;
        }

        .save-project h3 {
          margin-bottom: 1rem;
          color: #333;
        }

        .no-content-warning {
          text-align: center;
          padding: 2rem;
          color: #666;
          background: white;
          border-radius: 8px;
          border: 1px dashed #e0e0e0;
        }

        .save-form {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          border: 1px solid #e0e0e0;
        }

        .content-summary {
          margin: 1rem 0;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 5px;
        }

        .content-summary h4 {
          margin-bottom: 0.5rem;
          color: #333;
        }

        .content-summary ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .content-summary li {
          margin-bottom: 0.25rem;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default SaveProject;
