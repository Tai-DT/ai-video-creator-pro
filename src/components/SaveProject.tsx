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

    </div>
  );
};

export default SaveProject;
