import { useState, useRef } from "react";
import "../../styles/resources.css";

const Resources = ({ documents, fetchDocuments, userRole }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  if (!userRole) {
    return <p className="text-red-500">Loading user role...</p>;
  }

  const handleFileChange = (event) => {
    if (event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Please select a file to upload.");
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("File uploaded successfully!");
        fetchDocuments();
      } else {
        alert("Upload failed.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Upload error. Check console for details.");
    }

    setUploading(false);
    setSelectedFile(null);
  };

  const removeFileExtension = (filename) => {
    return filename.replace(/\.[^/.]+$/, "");
  };

  return (
    <div className="widget">
      <span className="font-bold text-2xl">Resources</span>
      {userRole === "Super Admin" ?     
       <div className="modal">
        <div className="modal-header">
          <div className="modal-logo">
            <span className="logo-circle">
              <svg xmlns="http://www.w3.org/2000/svg" width={25} height={25} viewBox="0 0 512 419.116">
                <g id="folder-new">
                  <path id="Union_1" d="M16.991,419.116A16.989,16.989,0,0,1,0,402.125V16.991A16.989,16.989,0,0,1,16.991,0H146.124a17,17,0,0,1,10.342,3.513L227.217,57.77H437.805A16.989,16.989,0,0,1,454.8,74.761v53.244h40.213A16.992,16.992,0,0,1,511.6,148.657L454.966,405.222a17,17,0,0,1-16.6,13.332H410.053v.562ZM63.06,384.573H424.722L473.86,161.988H112.2Z" fill="var(--c-action-primary)" stroke="currentColor" strokeWidth={1} />
                </g>
              </svg>
            </span>
          </div>
        </div>
        <div className="modal-body">
          <p className="modal-title">Upload a file</p>
          <p className="modal-description">Attach the file below</p>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />

          <button onClick={triggerFileSelect} className="upload-area">

            <span className="upload-area-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width={35} height={35} viewBox="0 0 340.531 419.116">
                <g id="files-new">
                  <path id="Union_2" d="M-2904.708-8.885A39.292,39.292,0,0,1-2944-48.177V-388.708A39.292,39.292,0,0,1-2904.708-428h209.558a13.1,13.1,0,0,1,9.3,3.8l78.584,78.584a13.1,13.1,0,0,1,3.8,9.3V-48.177a39.292,39.292,0,0,1-39.292,39.292Zm-13.1-379.823V-48.177a13.1,13.1,0,0,0,13.1,13.1h261.947a13.1,13.1,0,0,0,13.1-13.1V-323.221h-52.39a26.2,26.2,0,0,1-26.194-26.195v-52.39h-196.46A13.1,13.1,0,0,0-2917.805-388.708Z" transform="translate(2944 428)" fill="var(--c-action-primary)" />
                </g>
              </svg>
            </span>
            <span className="upload-area-title">{selectedFile ? selectedFile.name : "Click to upload"}</span>
          </button>
        </div>
        <div className="modal-footer">
          
          <button className="btn-primary font-bold" disabled={uploading} onClick={handleUpload}>
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div> : null}

      {documents.length === 0 ? (
        <p className="text-gray-600">No resources available.</p>
      ) : (
        <div className="grid-container">
          {documents.map((doc, index) => (
            <div key={index} className="card">
              <div className="card-details">
                <p className="text-title">{removeFileExtension(doc.filename)}</p>
              </div>
              <a href={`/api/download/${doc.filename}`} className="card-button font-bold lynx-bg" download>
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Resources;
