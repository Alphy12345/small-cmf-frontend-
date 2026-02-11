import React, { useState, useEffect } from 'react';
import { FileText as ReportIcon, Download, FilePlus, Upload, ChevronLeft, ChevronRight, Palette, Table, Settings } from 'lucide-react';
import useReportStore from '../store/report';
import useBboxStore from '../store/bbox';
import PDFViewer from './PDFViewer';
import jsPDF from 'jspdf';
import cmtiLogo from '../assets/cmti.png';

const Report = ({ 
  partData, partId, bomData, logo, setLogo, customFields, notes,
  showReportModal, setShowReportModal,
  showCustomFieldsModal, setShowCustomFieldsModal,
  showLogoModal, setShowLogoModal,
  showStatus
}) => {

  // Access PDF drawing data from bbox store
  const { pdfData, pdfDimensions, currentPage } = useBboxStore();

  // State for table data management
  const [tableData, setTableData] = useState([]);
  const [tableHeaders, setTableHeaders] = useState([
    'ID', 'NOMINAL', 'TOLERANCE', 'TYPE', 'M1', 'M2', 'M3', 'MEAN', 'STATUS'
  ]);

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    row: null,
    col: null
  });

  const handleContextMenu = (e, rowIndex, colIndex) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      row: rowIndex,
      col: colIndex
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      row: null,
      col: null
    });
  };
const [isResizingLogo, setIsResizingLogo] = useState(null); // null, 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

const handleLogoResizeMouseDown = (e, handle) => {
  e.preventDefault();
  e.stopPropagation();
  setIsResizingLogo(handle);
  setResizeStart({
    x: e.clientX,
    y: e.clientY,
    width: reportCompanyLogoSize.width,
    height: reportCompanyLogoSize.height
  });
};

// State for company name in report header (draggable & resizable)
const [companyNamePosition, setCompanyNamePosition] = useState({ x: 20, y: 10, isDragging: false });
const [companyNameDragStart, setCompanyNameDragStart] = useState({ x: 0, y: 0 });
const [companyNameSize, setCompanyNameSize] = useState({ fontSize: 20, width: 300 });
const [showNameControls, setShowNameControls] = useState(false);
// State for company logo in report header (draggable & resizable)
const [reportCompanyLogoPosition, setReportCompanyLogoPosition] = useState({ x: 340, y: 10, isDragging: false });
const [reportCompanyLogoDragStart, setReportCompanyLogoDragStart] = useState({ x: 0, y: 0 });
const [reportCompanyLogoSize, setReportCompanyLogoSize] = useState({ width: 150, height: 80 });
const [showLogoControls, setShowLogoControls] = useState(false);

// Company name drag handlers for report header
const handleCompanyNameMouseDown = (e) => {
  e.preventDefault();
  e.stopPropagation();
  const headerElement = document.getElementById('report-header');
  if (!headerElement) return;
  
  const rect = headerElement.getBoundingClientRect();
  setCompanyNameDragStart({
    x: e.clientX - rect.left - companyNamePosition.x,
    y: e.clientY - rect.top - companyNamePosition.y
  });
  setCompanyNamePosition(prev => ({ ...prev, isDragging: true }));
};

// Company logo drag handlers for report header
const handleReportCompanyLogoMouseDown = (e) => {
  e.preventDefault();
  e.stopPropagation();
  const headerElement = document.getElementById('report-header');
  if (!headerElement) return;
  
  const rect = headerElement.getBoundingClientRect();
  setReportCompanyLogoDragStart({
    x: e.clientX - rect.left - reportCompanyLogoPosition.x,
    y: e.clientY - rect.top - reportCompanyLogoPosition.y
  });
  setReportCompanyLogoPosition(prev => ({ ...prev, isDragging: true }));
};


  const [customHeaders, setCustomHeaders] = useState([]);
  const [showCustomHeadersModal, setShowCustomHeadersModal] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [showThemesModal, setShowThemesModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // State for report zoom and alignment
  const [reportZoom, setReportZoom] = useState(1);
  const [reportAlignment, setReportAlignment] = useState('center');

  // New state for company name and logo
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [companyLogoPosition, setCompanyLogoPosition] = useState({ x: 20, y: 20, isDragging: false });
  const [companyLogoDragStart, setCompanyLogoDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        closeContextMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.visible]);

  const reportThemes = {
    default: {
      name: 'Default Theme',
      headerBg: '#ffffff',
      headerBorder: '#000000',
      titleColor: '#000000',
      subtitleColor: '#4b5563',
      sectionBg: '#ffffff',
      sectionBorder: '#e5e7eb',
      tableHeaderBg: '#f9fafb',
      tableHeaderColor: '#374151',
      tableBorder: '#e5e7eb',
      footerBg: '#f9fafb',
      footerColor: '#6b7280'
    },
    blue: {
      name: 'Blue Professional',
      headerBg: '#1e40af',
      headerBorder: '#1e40af',
      titleColor: '#ffffff',
      subtitleColor: '#dbeafe',
      sectionBg: '#ffffff',
      sectionBorder: '#3b82f6',
      tableHeaderBg: '#eff6ff',
      tableHeaderColor: '#1e40af',
      tableBorder: '#3b82f6',
      footerBg: '#f0f9ff',
      footerColor: '#1e40af'
    },
    green: {
      name: 'Green Corporate',
      headerBg: '#166534',
      headerBorder: '#166534',
      titleColor: '#ffffff',
      subtitleColor: '#dcfce7',
      sectionBg: '#ffffff',
      sectionBorder: '#22c55e',
      tableHeaderBg: '#f0fdf4',
      tableHeaderColor: '#166534',
      tableBorder: '#22c55e',
      footerBg: '#f0fdf4',
      footerColor: '#166534'
    },
    purple: {
      name: 'Purple Modern',
      headerBg: '#6b21a8',
      headerBorder: '#6b21a8',
      titleColor: '#ffffff',
      subtitleColor: '#f3e8ff',
      sectionBg: '#ffffff',
      sectionBorder: '#a855f7',
      tableHeaderBg: '#faf5ff',
      tableHeaderColor: '#6b21a8',
      tableBorder: '#a855f7',
      footerBg: '#faf5ff',
      footerColor: '#6b21a8'
    },
    minimal: {
      name: 'Minimal Light',
      headerBg: '#fafafa',
      headerBorder: '#d1d5db',
      titleColor: '#374151',
      subtitleColor: '#6b7280',
      sectionBg: '#ffffff',
      sectionBorder: '#e5e7eb',
      tableHeaderBg: '#f9fafb',
      tableHeaderColor: '#374151',
      tableBorder: '#e5e7eb',
      footerBg: '#f9fafb',
      footerColor: '#9ca3af'
    }
  };

  const ThemesModal = () => {
    if (!showThemesModal) return null;
    
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1003,
          padding: '1rem'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowThemesModal(false);
          }
        }}
      >
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          width: '500px',
          maxWidth: '95vw',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.25rem', 
            fontWeight: '700', 
            color: '#111827' 
          }}>
            Choose Report Theme
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '0.5rem' 
            }}>
              Select Theme
            </label>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {Object.entries(reportThemes).map(([key, theme]) => (
                <div
                  key={key}
                  onClick={() => setSelectedTheme(key)}
                  style={{
                    padding: '1rem',
                    border: selectedTheme === key ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: selectedTheme === key ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (selectedTheme !== key) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedTheme !== key) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '4px',
                      backgroundColor: theme.headerBg,
                      border: `2px solid ${theme.headerBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: theme.titleColor,
                        borderRadius: '2px'
                      }}></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '0.25rem'
                      }}>
                        {theme.name}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>
                        Professional {key} theme for reports
                      </div>
                    </div>
                    {selectedTheme === key && (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff'
                        }}></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowThemesModal(false)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#374151',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => setShowThemesModal(false)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Apply Theme
            </button>
          </div>
        </div>
      </div>
    );
  };

  const { reportData, loading: reportLoading, error: reportError, fetchPartReport } = useReportStore();
  const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0, isDragging: false });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize table data from reportData
  useEffect(() => {
    if (reportData?.quantity_reports && reportData.quantity_reports.length > 0) {
      const selectedReport = reportData.quantity_reports.find(
        qr => qr.quantity.toString() === selectedQuantity
      ) || reportData.quantity_reports[0];

      if (selectedReport?.balloons) {
        const formattedData = selectedReport.balloons.map(balloonItem => ({
          nominal: balloonItem.balloon?.nominal || 'N/A',
          tolerance: balloonItem.balloon?.utol && balloonItem.balloon?.ltol 
            ? `${balloonItem.balloon.ltol} / ${balloonItem.balloon.utol}` 
            : 'N/A',
          type: balloonItem.balloon?.type || 'N/A',
          m1: balloonItem.measurements?.[0]?.m1 || 'N/A',
          m2: balloonItem.measurements?.[0]?.m2 || 'N/A',
          m3: balloonItem.measurements?.[0]?.m3 || 'N/A',
          mean: balloonItem.measurements?.[0]?.mean || 'N/A',
          status: balloonItem.measurements?.[0]?.go_or_no_go || 'N/A'
        }));
        setTableData(formattedData);
      }
    }
  }, [reportData, selectedQuantity]);

  const handleLogoMouseDown = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - logoPosition.x,
      y: e.clientY - rect.top - logoPosition.y
    });
    setLogoPosition(prev => ({ ...prev, isDragging: true }));
  };

  const handleMouseMove = (e) => {
    if (!logoPosition.isDragging) return;
    
    const headerRect = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - headerRect.left - dragStart.x;
    const newY = e.clientY - headerRect.top - dragStart.y;
    
    const maxX = headerRect.width - 120;
    const maxY = headerRect.height - 60;
    
    setLogoPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
      isDragging: true
    });
  };

  const handleMouseUp = () => {
    if (logoPosition.isDragging) {
      setLogoPosition(prev => ({ ...prev, isDragging: false }));
    }
  };

  // Company logo drag handlers
  const handleCompanyLogoMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const modalContent = document.getElementById('custom-headers-modal-content');
    if (!modalContent) return;
    
    const rect = modalContent.getBoundingClientRect();
    setCompanyLogoDragStart({
      x: e.clientX - rect.left - companyLogoPosition.x,
      y: e.clientY - rect.top - companyLogoPosition.y
    });
    setCompanyLogoPosition(prev => ({ ...prev, isDragging: true }));
  };

  useEffect(() => {
  const handleGlobalMouseMove = (e) => {
    // Existing logo dragging code
    if (logoPosition.isDragging) {
      const headerElement = document.getElementById('report-header');
      if (headerElement) {
        const headerRect = headerElement.getBoundingClientRect();
        const newX = e.clientX - headerRect.left - dragStart.x;
        const newY = e.clientY - headerRect.top - dragStart.y;
        
        const maxX = headerRect.width - 120;
        const maxY = headerRect.height - 60;
        
        setLogoPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
          isDragging: true
        });
      }
    }

    // Handle company logo dragging in modal
    if (companyLogoPosition.isDragging) {
      const modalContent = document.getElementById('custom-headers-modal-content');
      if (modalContent) {
        const rect = modalContent.getBoundingClientRect();
        const newX = e.clientX - rect.left - companyLogoDragStart.x;
        const newY = e.clientY - rect.top - companyLogoDragStart.y;
        
        const maxX = rect.width - 150;
        const maxY = rect.height - 100;
        
        setCompanyLogoPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
          isDragging: true
        });
      }
    }

    // NEW: Handle company name dragging in report header
    if (companyNamePosition.isDragging) {
      const headerElement = document.getElementById('report-header');
      if (headerElement) {
        const rect = headerElement.getBoundingClientRect();
        const newX = e.clientX - rect.left - companyNameDragStart.x;
        const newY = e.clientY - rect.top - companyNameDragStart.y;
        
        const maxX = rect.width - companyNameSize.width;
        const maxY = rect.height - 50;
        
        setCompanyNamePosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
          isDragging: true
        });
      }
    }

    // NEW: Handle company logo dragging in report header
    if (reportCompanyLogoPosition.isDragging) {
      const headerElement = document.getElementById('report-header');
      if (headerElement) {
        const rect = headerElement.getBoundingClientRect();
        const newX = e.clientX - rect.left - reportCompanyLogoDragStart.x;
        const newY = e.clientY - rect.top - reportCompanyLogoDragStart.y;
        
        const maxX = rect.width - reportCompanyLogoSize.width;
        const maxY = rect.height - reportCompanyLogoSize.height;
        
        setReportCompanyLogoPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
          isDragging: true
        });
      }
    }

    // Handle logo resizing
    if (isResizingLogo) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      
      switch (isResizingLogo) {
        case 'se': // bottom-right corner
          newWidth = Math.max(50, Math.min(400, resizeStart.width + deltaX));
          newHeight = Math.max(30, Math.min(200, resizeStart.height + deltaY));
          break;
        case 'sw': // bottom-left corner
          newWidth = Math.max(50, Math.min(400, resizeStart.width - deltaX));
          newHeight = Math.max(30, Math.min(200, resizeStart.height + deltaY));
          break;
        case 'ne': // top-right corner
          newWidth = Math.max(50, Math.min(400, resizeStart.width + deltaX));
          newHeight = Math.max(30, Math.min(200, resizeStart.height - deltaY));
          break;
        case 'nw': // top-left corner
          newWidth = Math.max(50, Math.min(400, resizeStart.width - deltaX));
          newHeight = Math.max(30, Math.min(200, resizeStart.height - deltaY));
          break;
        case 'e': // right edge
          newWidth = Math.max(50, Math.min(400, resizeStart.width + deltaX));
          break;
        case 'w': // left edge
          newWidth = Math.max(50, Math.min(400, resizeStart.width - deltaX));
          break;
        case 'n': // top edge
          newHeight = Math.max(30, Math.min(200, resizeStart.height - deltaY));
          break;
        case 's': // bottom edge
          newHeight = Math.max(30, Math.min(200, resizeStart.height + deltaY));
          break;
      }
      
      setReportCompanyLogoSize({ width: newWidth, height: newHeight });
    }
  };

  const handleGlobalMouseUp = () => {
    if (logoPosition.isDragging) {
      setLogoPosition(prev => ({ ...prev, isDragging: false }));
    }
    if (companyLogoPosition.isDragging) {
      setCompanyLogoPosition(prev => ({ ...prev, isDragging: false }));
    }
    if (companyNamePosition.isDragging) {
      setCompanyNamePosition(prev => ({ ...prev, isDragging: false }));
    }
    if (reportCompanyLogoPosition.isDragging) {
      setReportCompanyLogoPosition(prev => ({ ...prev, isDragging: false }));
    }
    if (isResizingLogo) {
      setIsResizingLogo(null);
    }
  };

  if (logoPosition.isDragging || companyLogoPosition.isDragging || 
      companyNamePosition.isDragging || reportCompanyLogoPosition.isDragging || isResizingLogo) {
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  }

  return () => {
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
  };
}, [logoPosition.isDragging, companyLogoPosition.isDragging, dragStart, companyLogoDragStart,
    companyNamePosition.isDragging, companyNameDragStart, companyNameSize.width,
    reportCompanyLogoPosition.isDragging, reportCompanyLogoDragStart, 
    reportCompanyLogoSize.width, reportCompanyLogoSize.height, isResizingLogo, resizeStart]);

  useEffect(() => {
    if (reportData?.quantity_reports && reportData.quantity_reports.length > 0 && !selectedQuantity) {
      setSelectedQuantity(reportData.quantity_reports[0].quantity.toString());
    }
  }, [reportData, selectedQuantity]);

  useEffect(() => {
    if (showReportModal && partId) {
      fetchPartReport(partId).catch(err => {
        console.error('Failed to fetch report data:', err);
        showStatus('Failed to load report data', 'error');
      });
    }
  }, [showReportModal, partId, fetchPartReport, showStatus]);

  const generatePDF = async () => {
  try {
    showStatus('Generating PDF...', 'info');
    const { jsPDF } = await import('jspdf');
    
    // Create PDF in portrait mode for separate A4 pages with larger margins
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth(); // ~210mm in portrait
    const pageHeight = pdf.internal.pageSize.getHeight(); // ~297mm in portrait
    const margin = 20; // Increased margin for more space
    
    let currentY = margin;

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredHeight) => {
      if (currentY + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    // Helper function to update Y position
    const updateYPosition = (increment) => {
      currentY += increment;
    };

    const getYPosition = () => {
      return currentY;
    };

    // ===== PAGE 1: Inspection Report =====
    
    // Add company logo if available (positioned on the left side)
    if (companyLogo) {
      try {
        const logoWidth = 40;
        const logoHeight = 20;
        const logoX = margin; // Left margin
        pdf.addImage(companyLogo, 'PNG', logoX, currentY - (logoHeight / 2), logoWidth, logoHeight);
      } catch (error) {
        console.warn('Could not add company logo to PDF:', error);
      }
    }

    // Add company name if available (positioned to the right of logo)
    if (companyName) {
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      const nameX = margin + 45; // 45mm from left (logo width + 5mm gap)
      pdf.text(companyName, nameX, currentY + 5, { align: 'left' });
    }

    updateYPosition(25);

    // Skip the title since we're showing company name and logo instead

    // Separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, getYPosition(), pageWidth - margin, getYPosition());
    updateYPosition(10);

    // Part Information Section
    checkPageBreak(40);
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Part Information', margin, getYPosition());
    updateYPosition(8);

    // Create table for part information
    const partInfoData = [
      ['Part Number:', String(reportData?.part_no || 'N/A')],
      ['Part Name:', String(reportData?.part_name || 'N/A')],
      ['Project:', String(reportData?.boc?.project?.name || 'N/A')],
      ['Quantity:', String(reportData?.boc?.quantity || 'N/A')]
    ];

    const infoTableWidth = pageWidth - 2 * margin; // Full width from left to right margin
    const labelWidth = 35; // Width for label column
    const valueWidth = infoTableWidth - labelWidth; // Width for value column
    const infoRowHeight = 6;
    const infoTableX = margin; // Start from left margin

    pdf.setFontSize(9);
    
    partInfoData.forEach(([label, value]) => {
      checkPageBreak(infoRowHeight + 2);
      
      // Draw table border
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      
      // Draw row border
      pdf.rect(infoTableX, getYPosition(), infoTableWidth, infoRowHeight);
      
      // Draw vertical line between label and value
      pdf.line(infoTableX + labelWidth, getYPosition(), infoTableX + labelWidth, getYPosition() + infoRowHeight);
      
      // Add label (bold)
      pdf.setFont(undefined, 'bold');
      pdf.text(label, infoTableX + 2, getYPosition() + 4);
      
      // Add value (normal)
      pdf.setFont(undefined, 'normal');
      pdf.text(value, infoTableX + labelWidth + 2, getYPosition() + 4);
      
      updateYPosition(infoRowHeight);
    });

    updateYPosition(5);

    // Custom Headers - formatted like Part Information
    if (customHeaders.length > 0) {
      updateYPosition(15);
      
      customHeaders.forEach((header, index) => {
        checkPageBreak(20);
        
        // Header name as section title (like "Part Information")
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text(String(header.name), margin, getYPosition());
        updateYPosition(8);
        
        // Value in a table row (like Part Information rows)
        pdf.setFontSize(9);
        
        // Draw row border
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.rect(margin, getYPosition(), infoTableWidth, infoRowHeight);
        
        // Add value label (bold)
        pdf.setFont(undefined, 'bold');
        pdf.text('Value:', margin + 2, getYPosition() + 4);
        
        // Add actual value (normal)
        pdf.setFont(undefined, 'normal');
        pdf.text(String(header.value), margin + labelWidth + 2, getYPosition() + 4);
        
        // Vertical line
        pdf.line(margin + labelWidth, getYPosition(), margin + labelWidth, getYPosition() + infoRowHeight);
        
        updateYPosition(infoRowHeight + 10);
      });
    }

    // Add spacing before table
    updateYPosition(15);
    
    // ===== PAGE 2: Inspection Data Table =====
    pdf.addPage();
    let tableY = margin;
    
    // Full width table calculation - columns sum to 100%
    const tableWidth = pageWidth - 2 * margin;
    const colWidths = [
      tableWidth * 0.08,  // ID
      tableWidth * 0.13,  // NOMINAL
      tableWidth * 0.18,  // TOLERANCE
      tableWidth * 0.13,  // TYPE
      tableWidth * 0.10,  // M1
      tableWidth * 0.10,  // M2
      tableWidth * 0.10,  // M3
      tableWidth * 0.10,  // MEAN
      tableWidth * 0.08   // STATUS
    ];
    const headers = ['ID', 'NOMINAL', 'TOLERANCE', 'TYPE', 'M1', 'M2', 'M3', 'MEAN', 'STATUS'];
    
    // Title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Inspection Data', margin, tableY);
    tableY += 10;
    
    // Headers
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    let x = margin;
    const headerHeight = 12;
    const rowHeight = 15; // Much taller rows to fill page
    
    headers.forEach((h, i) => {
      pdf.rect(x, tableY, colWidths[i], headerHeight);
      pdf.text(h, x + 2, tableY + headerHeight - 3);
      x += colWidths[i];
    });
    tableY += headerHeight;
    
    // Data rows - fill page with tall rows
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    tableData.forEach((row, idx) => {
      if (tableY > pageHeight - margin - 20) {
        pdf.addPage();
        tableY = margin;
      }
      
      const values = [
        String(idx + 1),
        String(row.nominal || '-'),
        String(row.tolerance || '-'),
        String(row.type || '-'),
        String(row.m1 || '-'),
        String(row.m2 || '-'),
        String(row.m3 || '-'),
        String(row.mean || '-'),
        String(row.status || '-')
      ];
      
      x = margin;
      values.forEach((val, i) => {
        pdf.rect(x, tableY, colWidths[i], rowHeight);
        pdf.text(val.substring(0, 30), x + 2, tableY + rowHeight - 4);
        x += colWidths[i];
      });
      
      tableY += rowHeight;
    });
    
    // ===== PAGE 3: Notes Section =====
    if (notes && notes.length > 0) {
      pdf.addPage();
      let noteY = margin;
      
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Notes', margin, noteY);
      noteY += 15;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      
      let noteNumber = 1;
      notes.forEach((note) => {
        const noteText = String(note.note_text || '');
        if (!noteText) return;
        
        // Remove NOTE: prefix and split by numbered patterns
        const cleanedText = noteText.replace(/^NOTE:\s*/i, '').trim();
        const items = cleanedText.split(/\n?\s*\d+\.\s*/)
                                 .map(item => item.trim())
                                 .filter(item => item.length > 0);
        
        items.forEach((item) => {
          // Only keep actual note sentences (not metadata labels)
          const upper = item.toUpperCase();
          const isNote = upper.includes('TO BE') || upper.includes('CHAMFER') || 
                        upper.includes('HARDEN') || upper.includes('SURFACE') || 
                        upper.includes('PEENED') || upper.includes('PLATED') ||
                        upper.includes('SHARP') || upper.includes('EDGE') ||
                        (item.length > 20 && item.split(' ').length > 4);
          
          if (!isNote) return;
          
          if (noteY > pageHeight - margin - 30) {
            pdf.addPage();
            noteY = margin;
          }
          
          pdf.setFont(undefined, 'bold');
          pdf.text(`${noteNumber}.`, margin, noteY);
          pdf.setFont(undefined, 'normal');
          
          const textX = margin + 15;
          const maxWidth = pageWidth - 2 * margin - 20;
          const wrappedLines = pdf.splitTextToSize(item, maxWidth);
          
          wrappedLines.forEach((line, idx) => {
            if (idx > 0 && noteY > pageHeight - margin - 30) {
              pdf.addPage();
              noteY = margin;
            }
            pdf.text(line, textX, noteY);
            if (idx < wrappedLines.length - 1) {
              noteY += 6;
            }
          });
          
          noteY += 12;
          noteNumber++;
        });
      });
    }
    
    // Get total pages after table and notes
    const totalPages = pdf.internal.getNumberOfPages();
    const lastPage = totalPages;

    // Add CMTI logo as watermark (centered, semi-transparent)
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      try {
        const watermarkWidth = 120; // Width of watermark
        const watermarkHeight = 60; // Height of watermark
        const watermarkX = (pageWidth - watermarkWidth) / 2; // Center horizontally
        const watermarkY = (pageHeight - watermarkHeight) / 2; // Center vertically
        
        // Set transparency for watermark
        pdf.setGState(new pdf.GState({ opacity: 0.1 })); // 10% opacity for watermark
        pdf.addImage(cmtiLogo, 'PNG', watermarkX, watermarkY, watermarkWidth, watermarkHeight);
        
        // Reset transparency
        pdf.setGState(new pdf.GState({ opacity: 1.0 }));
      } catch (error) {
        console.warn('Could not add watermark to page:', i, error);
      }
    }
    
    // Add black bold border to all pages
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(2); // Bold border
      pdf.rect(5, 5, pageWidth - 10, pageHeight - 10); // Border with 5mm margin from edges
    }
    
    pdf.setPage(lastPage);
    
    // Footer positioning - increased size
    const footerY = pageHeight - 30; // Position footer 30mm from bottom (increased)
    const footerMargin = 15;
    const footerWidth = pageWidth - 2 * footerMargin;
    const footerRowHeight = 7; // Increased from 4
    
    // Column widths based on the image layout - adjusted for empty box
    const col1Width = 30;  // Prepared/Checked/Approved labels
    const col2Width = 25;  // NH/BR/SGK names
    const col3Width = 50;  // Large empty square box
    const col4Width = 35;  // Centre/Group and Ref master BOM No labels
    const col5Width = footerWidth - col1Width - col2Width - col3Width - col4Width; // Values and page
    
    pdf.setFontSize(9); // Increased from 6
    pdf.setTextColor(0, 0, 0);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.4); // Increased from 0.2
    
    // Row 1: Prepared, Empty Box, Centre/Group
    // Prepared cell
    pdf.rect(footerMargin, footerY, col1Width, footerRowHeight);
    pdf.setFont(undefined, 'normal');
    pdf.text('Prepared:', footerMargin + 3, footerY + 5);
    
    // Prepared name cell
    pdf.rect(footerMargin + col1Width, footerY, col2Width, footerRowHeight);
    pdf.text('NH', footerMargin + col1Width + 3, footerY + 5);
    
    // Large empty square box (spans 3 rows)
    const emptyBoxX = footerMargin + col1Width + col2Width;
    const emptyBoxHeight = footerRowHeight * 3;
    pdf.rect(emptyBoxX, footerY, col3Width, emptyBoxHeight);
    
    // Centre/Group label cell
    pdf.rect(footerMargin + col1Width + col2Width + col3Width, footerY, col4Width, footerRowHeight);
    pdf.text('Centre /', footerMargin + col1Width + col2Width + col3Width + 3, footerY + 3);
    pdf.text('Group:', footerMargin + col1Width + col2Width + col3Width + 3, footerY + 6);
    
    // Centre/Group value cell
    pdf.rect(footerMargin + col1Width + col2Width + col3Width + col4Width, footerY, col5Width, footerRowHeight);
    pdf.text('C-SMPM/G-SPMA', footerMargin + col1Width + col2Width + col3Width + col4Width + 3, footerY + 5);
    
    // Row 2: Checked, (empty box continues), Ref master BOM No
    const row2Y = footerY + footerRowHeight;
    
    // Checked cell
    pdf.rect(footerMargin, row2Y, col1Width, footerRowHeight);
    pdf.text('Checked:', footerMargin + 3, row2Y + 5);
    
    // Checked name cell
    pdf.rect(footerMargin + col1Width, row2Y, col2Width, footerRowHeight);
    pdf.text('BR', footerMargin + col1Width + 3, row2Y + 5);
    
    // Empty box continues (no rect drawn here as it spans all 3 rows)
    
    // Ref master BOM No label cell
    pdf.rect(footerMargin + col1Width + col2Width + col3Width, row2Y, col4Width, footerRowHeight);
    pdf.text('Ref master', footerMargin + col1Width + col2Width + col3Width + 3, row2Y + 3);
    pdf.text('BOM No:', footerMargin + col1Width + col2Width + col3Width + 3, row2Y + 6);
    
    // Ref master BOM No value cell
    pdf.rect(footerMargin + col1Width + col2Width + col3Width + col4Width, row2Y, col5Width, footerRowHeight);
    pdf.text('BOM-2025-001', footerMargin + col1Width + col2Width + col3Width + col4Width + 3, row2Y + 5);
    
    // Row 3: Approved, (empty box continues), Page X of Y
    const row3Y = row2Y + footerRowHeight;
    
    // Approved cell
    pdf.rect(footerMargin, row3Y, col1Width, footerRowHeight);
    pdf.text('Approved:', footerMargin + 3, row3Y + 5);
    
    // Approved name cell
    pdf.rect(footerMargin + col1Width, row3Y, col2Width, footerRowHeight);
    pdf.text('SGK', footerMargin + col1Width + 3, row3Y + 5);
    
    // Empty box continues (no rect drawn here as it spans all 3 rows)
    
    // Page X of Y cell (spans remaining columns)
    pdf.rect(footerMargin + col1Width + col2Width + col3Width, row3Y, col4Width + col5Width, footerRowHeight);
    const pageText = `Page ${lastPage} of ${totalPages}`;
    const pageTextWidth = pdf.getTextWidth(pageText);
    const pageTextX = footerMargin + col1Width + col2Width + col3Width + (col4Width + col5Width - pageTextWidth) / 2;
    pdf.text(pageText, pageTextX, row3Y + 5);

    const fileName = `Inspection_Report_${partData.name || 'Direct_Part'}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    showStatus('PDF downloaded successfully!', 'success');
    setShowReportModal(false);

  } catch (error) {
    console.error('Error generating PDF:', error);
    showStatus('Error generating PDF: ' + error.message, 'error');
  }
};

  const CustomHeadersModal = () => {
    if (!showCustomHeadersModal) return null;
    
    // ... (rest of the code remains the same)
    const handleCompanyLogoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          showStatus('Please upload an image file', 'error');
          return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
          showStatus('Image size should be less than 5MB', 'error');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setCompanyLogo(e.target.result);
          showStatus('Company logo uploaded successfully!', 'success');
        };
        reader.readAsDataURL(file);
      }
    };

    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '1rem'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCustomHeadersModal(false);
          }
        }}
      >
        <div 
          id="custom-headers-modal-content"
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            width: '600px',
            maxWidth: '95vw',
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'relative'
          }}
        >
          <h3 style={{ 
            margin: '0 0 1.5rem 0', 
            fontSize: '1.25rem', 
            fontWeight: '700', 
            color: '#111827' 
          }}>
            Report Header Configuration
          </h3>

          {/* Report Header Preview Section */}
          <div style={{ 
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '700', 
              color: '#374151', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Report Header Preview
            </label>
            
            {/* Preview Area */}
            <div 
              style={{
                border: '2px dashed #d1d5db',
                borderRadius: '6px',
                padding: '1rem',
                backgroundColor: '#ffffff',
                minHeight: '120px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}>
                Drag logo and company name to position them
              </div>
              
              {/* Company Name Preview */}
              {companyName && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${companyNamePosition.x}px`,
                    top: `${companyNamePosition.y + 30}px`,
                    fontSize: `${companyNameSize.fontSize}px`,
                    width: `${companyNameSize.width}px`,
                    display: 'inline-block',
                    padding: '0.5rem',
                    border: companyNamePosition.isDragging ? '2px dashed #3b82f6' : '2px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: companyNamePosition.isDragging ? '#eff6ff' : '#fafafa',
                    cursor: companyNamePosition.isDragging ? 'grabbing' : 'grab',
                    zIndex: companyNamePosition.isDragging ? 1000 : 1,
                    transition: companyNamePosition.isDragging ? 'none' : 'all 0.2s',
                    boxShadow: companyNamePosition.isDragging ? '0 4px 6px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseDown={handleCompanyNameMouseDown}
                >
                  {companyName}
                </div>
              )}
              
              {/* Company Logo Preview */}
              {companyLogo && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${companyLogoPosition.x}px`,
                    top: `${companyLogoPosition.y + 30}px`,
                    width: '150px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.5rem',
                    border: companyLogoPosition.isDragging ? '2px dashed #3b82f6' : '2px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: companyLogoPosition.isDragging ? '#eff6ff' : 'transparent',
                    cursor: companyLogoPosition.isDragging ? 'grabbing' : 'grab',
                    zIndex: companyLogoPosition.isDragging ? 1000 : 2,
                    transition: companyLogoPosition.isDragging ? 'none' : 'all 0.2s',
                    boxShadow: companyLogoPosition.isDragging ? '0 4px 6px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseDown={handleCompanyLogoMouseDown}
                >
                  <img 
                    src={companyLogo} 
                    alt="Company Logo Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%',
                      objectFit: 'contain',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              )}
              
              {!companyName && !companyLogo && (
                <div style={{
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                  padding: '2rem'
                }}>
                  Add company name and/or logo below to preview
                </div>
              )}
            </div>
          </div>

          {/* Company Name Section */}
          <div style={{ 
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '700', 
              color: '#374151', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Company Logo Section */}
          <div style={{ 
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '700', 
              color: '#374151', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Company Logo
            </label>
            
            <input
              type="file"
              accept="image/*"
              onChange={handleCompanyLogoUpload}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            
            {companyLogo && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#eff6ff',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#1e40af',
                border: '1px solid #bfdbfe'
              }}>
                Logo uploaded and ready for positioning
              </div>
            )}
          </div>

          {/* Custom Headers Section */}
          <div style={{ 
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '700', 
              color: '#374151', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Additional Custom Headers
            </label>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                id="newHeaderName"
                placeholder="Header name (e.g., Inspector)"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}
              />
              <input
                type="text"
                id="newHeaderValue"
                placeholder="Header value"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}
              />
              <button
                onClick={() => {
                  const nameInput = document.getElementById('newHeaderName');
                  const valueInput = document.getElementById('newHeaderValue');
                  
                  if (nameInput.value.trim() && valueInput.value.trim()) {
                    setCustomHeaders([...customHeaders, { 
                      name: nameInput.value.trim(), 
                      value: valueInput.value.trim() 
                    }]);
                    nameInput.value = '';
                    valueInput.value = '';
                    showStatus('Header added successfully!', 'success');
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                + Add
              </button>
            </div>

            {customHeaders.length > 0 && (
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                <div style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: '600', 
                  color: '#6b7280', 
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Added Headers ({customHeaders.length}):
                </div>
                {customHeaders.map((header, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '700', 
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.125rem'
                      }}>
                        {header.name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>
                        {header.value}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setCustomHeaders(customHeaders.filter((_, i) => i !== index));
                        showStatus('Header removed', 'info');
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        border: '1px solid #ef4444',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            justifyContent: 'flex-end',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '1rem'
          }}>
            <button
              onClick={() => {
                setShowCustomHeadersModal(false);
                showStatus('Report header configured successfully!', 'success');
              }}
              style={{
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#059669';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#10b981';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ContextMenu = () => {
    if (!contextMenu.visible) return null;

    const menuItems = [
      { label: 'Add Column Before', action: 'addColumnBefore', divider: false },
      { label: 'Add Column After', action: 'addColumnAfter', divider: true },
      { label: 'Delete Column Before', action: 'deleteColumnBefore', divider: false },
      { label: 'Delete Column After', action: 'deleteColumnAfter', divider: false },
      { label: 'Delete Column', action: 'deleteColumn', divider: true },
      { label: 'Add Row Before', action: 'addRowBefore', divider: false },
      { label: 'Add Row After', action: 'addRowAfter', divider: true },
      { label: 'Delete Row Before', action: 'deleteRowBefore', divider: false },
      { label: 'Delete Row After', action: 'deleteRowAfter', divider: false },
      { label: 'Delete Row', action: 'deleteRow', divider: true },
      { label: 'Import Data', action: 'importData', divider: false },
      { label: 'Change column name', action: 'changeColumnName', divider: true },
      { label: 'Go', action: 'setGo', divider: false },
      { label: 'No-Go', action: 'setNoGo', divider: false },
      { label: 'Remove Go/No-Go', action: 'removeGoNoGo', divider: false }
    ];

    const handleMenuClick = (action) => {
      const { row, col } = contextMenu;
      
      switch (action) {
        case 'addColumnBefore':
          const beforeHeader = `Column ${tableHeaders.length + 1}`;
          const beforeHeaders = [...tableHeaders, beforeHeader];
          setTableHeaders(beforeHeaders);
          
          const beforeData = tableData.map(rowData => {
            const keys = ['nominal', 'tolerance', 'type', 'm1', 'm2', 'm3', 'mean', 'status'];
            const newRowData = { ...rowData };
            
            const newColumnIndex = beforeHeaders.length - 1;
            if (newColumnIndex < keys.length) {
              newRowData[keys[newColumnIndex]] = 'N/A';
            } else {
              newRowData[`col_${newColumnIndex}`] = 'N/A';
            }
            
            return newRowData;
          });
          
          setTableData(beforeData);
          showStatus('New column added at the end', 'success');
          break;
          
        case 'addColumnAfter':
          const afterHeader = `Column ${tableHeaders.length + 1}`;
          const afterHeaders = [...tableHeaders, afterHeader];
          setTableHeaders(afterHeaders);
          
          const afterData = tableData.map(rowData => {
            const keys = ['nominal', 'tolerance', 'type', 'm1', 'm2', 'm3', 'mean', 'status'];
            const newRowData = { ...rowData };
            
            const newColumnIndex = afterHeaders.length - 1;
            if (newColumnIndex < keys.length) {
              newRowData[keys[newColumnIndex]] = 'N/A';
            } else {
              newRowData[`col_${newColumnIndex}`] = 'N/A';
            }
            
            return newRowData;
          });
          
          setTableData(afterData);
          showStatus('New column added at the end', 'success');
          break;
          
        case 'deleteColumnBefore':
          if (col !== null && col > 0) {
            const newHeaders = tableHeaders.filter((_, index) => index !== col - 1);
            setTableHeaders(newHeaders);
            
            const newData = tableData.map(rowData => {
              const values = Object.values(rowData);
              values.splice(col - 1, 1);
              return {
                nominal: values[0] || 'N/A',
                tolerance: values[1] || 'N/A',
                type: values[2] || 'N/A',
                m1: values[3] || 'N/A',
                m2: values[4] || 'N/A',
                m3: values[5] || 'N/A',
                mean: values[6] || 'N/A',
                status: values[7] || 'N/A'
              };
            });
            setTableData(newData);
            showStatus('Column before deleted', 'success');
          }
          break;
          
        case 'deleteColumnAfter':
          if (col !== null && col < tableHeaders.length - 1) {
            const newHeaders = tableHeaders.filter((_, index) => index !== col + 1);
            setTableHeaders(newHeaders);
            
            const newData = tableData.map(rowData => {
              const values = Object.values(rowData);
              values.splice(col + 1, 1);
              return {
                nominal: values[0] || 'N/A',
                tolerance: values[1] || 'N/A',
                type: values[2] || 'N/A',
                m1: values[3] || 'N/A',
                m2: values[4] || 'N/A',
                m3: values[5] || 'N/A',
                mean: values[6] || 'N/A',
                status: values[7] || 'N/A'
              };
            });
            setTableData(newData);
            showStatus('Column after deleted', 'success');
          }
          break;
          
        case 'deleteColumn':
          if (col !== null) {
            const newHeaders = tableHeaders.filter((_, index) => index !== col);
            setTableHeaders(newHeaders);
            
            const newData = tableData.map(rowData => {
              const values = Object.values(rowData);
              values.splice(col, 1);
              return {
                nominal: values[0] || 'N/A',
                tolerance: values[1] || 'N/A',
                type: values[2] || 'N/A',
                m1: values[3] || 'N/A',
                m2: values[4] || 'N/A',
                m3: values[5] || 'N/A',
                mean: values[6] || 'N/A',
                status: values[7] || 'N/A'
              };
            });
            setTableData(newData);
            showStatus('Column deleted', 'success');
          }
          break;
          
        case 'addRowBefore':
          if (row !== null) {
            const newRow = {};
            const keys = ['nominal', 'tolerance', 'type', 'm1', 'm2', 'm3', 'mean', 'status'];
            
            tableHeaders.forEach((header, idx) => {
              if (idx < keys.length) {
                newRow[keys[idx]] = 'N/A';
              } else {
                newRow[`col_${idx}`] = 'N/A';
              }
            });
            
            const newData = [...tableData];
            newData.splice(row, 0, newRow);
            setTableData(newData);
            showStatus('Row added before row ' + (row + 1), 'success');
          }
          break;
          
        case 'addRowAfter':
          if (row !== null) {
            const newRow = {};
            const keys = ['nominal', 'tolerance', 'type', 'm1', 'm2', 'm3', 'mean', 'status'];
            
            tableHeaders.forEach((header, idx) => {
              if (idx < keys.length) {
                newRow[keys[idx]] = 'N/A';
              } else {
                newRow[`col_${idx}`] = 'N/A';
              }
            });
            
            const newData = [...tableData, newRow];
            setTableData(newData);
            showStatus('New row added at the end of table', 'success');
          }
          break;
          
        case 'deleteRowBefore':
          if (row !== null && row > 0) {
            const newData = tableData.filter((_, index) => index !== row - 1);
            setTableData(newData);
            showStatus('Row before deleted', 'success');
          }
          break;
          
        case 'deleteRowAfter':
          if (row !== null && row < tableData.length - 1) {
            const newData = tableData.filter((_, index) => index !== row + 1);
            setTableData(newData);
            showStatus('Row after deleted', 'success');
          }
          break;
          
        case 'deleteRow':
          if (row !== null) {
            const newData = tableData.filter((_, index) => index !== row);
            setTableData(newData);
            showStatus('Row deleted', 'success');
          }
          break;
          
        case 'importData':
          showStatus('Import data functionality - coming soon', 'info');
          break;
          
        case 'changeColumnName':
          if (col !== null) {
            const newName = prompt('Enter new column name:', tableHeaders[col]);
            if (newName && newName.trim()) {
              const newHeaders = [...tableHeaders];
              newHeaders[col] = newName.trim();
              setTableHeaders(newHeaders);
              showStatus('Column name changed', 'success');
            }
          }
          break;
          
        case 'setGo':
          if (row !== null) {
            const newData = [...tableData];
            newData[row].status = 'GO';
            setTableData(newData);
            showStatus('Status set to GO', 'success');
          }
          break;
          
        case 'setNoGo':
          if (row !== null) {
            const newData = [...tableData];
            newData[row].status = 'NO-GO';
            setTableData(newData);
            showStatus('Status set to NO-GO', 'success');
          }
          break;
          
        case 'removeGoNoGo':
          if (row !== null) {
            const newData = [...tableData];
            newData[row].status = 'N/A';
            setTableData(newData);
            showStatus('GO/NO-GO status removed', 'success');
          }
          break;
          
        default:
          console.log('Unknown action:', action);
      }
      
      closeContextMenu();
    };

    return (
      <div
        style={{
          position: 'fixed',
          left: contextMenu.x,
          top: contextMenu.y,
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          minWidth: '200px',
          maxHeight: '400px',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {menuItems.map((item, index) => (
          <React.Fragment key={index}>
            <div
              onClick={() => handleMenuClick(item.action)}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#374151',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              {item.label}
            </div>
            {item.divider && index < menuItems.length - 1 && (
              <div style={{ 
                height: '1px', 
                backgroundColor: '#e5e7eb', 
                margin: '0.25rem 0' 
              }} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (!showReportModal) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowReportModal(false);
        }
      }}
    >
      <div style={{
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        padding: '1.5rem',
        width: '1200px',
        maxWidth: '95vw',
        height: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        display: 'flex',
        gap: '1rem'
      }}>
        
        {/* LEFT SIDEBAR */}
        <div style={{
          width: sidebarCollapsed ? '60px' : '320px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          transition: 'width 0.3s ease',
          position: 'relative',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '2px solid #000000'
        }}>
          
          {/* Sidebar Header */}
          <div style={{
            borderBottom: '2px solid #000000',
            paddingBottom: '1rem',
            marginTop: '1rem'
          }}>
            {!sidebarCollapsed && (
              <h3 style={{
                color: '#000000',
                fontSize: '1.125rem',
                fontWeight: '700',
                margin: 0,
                textAlign: 'center',
                letterSpacing: '0.025em'
              }}>
                REPORT CONTROLS
              </h3>
            )}
          </div>

          {/* Sidebar Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flex: 1
          }}>
            
            {/* Top Row: Custom Headers and Quantity Selector - Side by Side */}
            {!sidebarCollapsed && (
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'stretch'
              }}>
                <button
                  onClick={() => setShowCustomHeadersModal(true)}
                  style={{
                    padding: '0.5rem',
                    border: '2px solid #000000',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '40px',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#000000';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#000000';
                  }}
                  title="Custom Headers"
                >
                  <FilePlus size={14} />
                </button>
                
                {reportData?.quantity_reports && reportData.quantity_reports.length > 0 && (
                  <div style={{
                    flex: 1,
                    backgroundColor: '#ffffff',
                    borderRadius: '6px',
                    border: '2px solid #000000',
                    padding: '0.5rem'
                  }}>
                    <select
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.375rem',
                        border: '1px solid #000000',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">All Qty</option>
                      {reportData.quantity_reports.map((qtyReport, index) => (
                        <option key={index} value={qtyReport.quantity}>
                          Qty{qtyReport.quantity}
                        </option>
                      ))}
                      <option value="consolidate">consolidate</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Spacer to push bottom buttons down */}
            <div style={{ flex: 1 }}></div>

            {/* Bottom Row: Download PDF and Close - Side by Side */}
            {!sidebarCollapsed && (
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button
                  onClick={generatePDF}
                  style={{
                    padding: '0.4rem 0.8rem',
                    border: '1px solid #3b82f6',
                    borderRadius: '4px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    flexDirection: 'row',
                    boxShadow: '0 1px 2px rgba(59, 130, 246, 0.2)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.borderColor = '#2563eb';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  title="Download PDF"
                >
                  <Download size={12} />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => setShowReportModal(false)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    border: '1px solid #ef4444',
                    borderRadius: '4px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    flexDirection: 'row',
                    boxShadow: '0 1px 2px rgba(239, 68, 68, 0.2)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.borderColor = '#dc2626';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                    e.currentTarget.style.borderColor = '#ef4444';
                  }}
                  title="Close Report"
                >
                  <span>Close</span>
                </button>
              </div>
            )}

            {/* Collapsed view - stacked buttons at bottom */}
            {sidebarCollapsed && (
              <>
                <button
                  onClick={generatePDF}
                  style={{
                    padding: '0.625rem',
                    border: '2px solid #000000',
                    borderRadius: '6px',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#333333';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#000000';
                  }}
                  title="Download PDF"
                >
                  <Download size={16} />
                </button>

                <button
                  onClick={() => setShowReportModal(false)}
                  style={{
                    padding: '0.625rem',
                    border: '2px solid #000000',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#000000';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#000000';
                  }}
                  title="Close Report"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>

        {/* A4 SHEET CONTAINER */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          overflow: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            width: '794px',
            minHeight: '1123px',
            margin: '0 auto',
            border: '3px solid #000000',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transform: `scale(${reportZoom})`,
            transformOrigin: reportAlignment === 'left' ? 'top left' : reportAlignment === 'right' ? 'top right' : 'top center',
            transition: 'transform 0.2s ease'
          }}>
            
            {/* Header */}
            <div 
              id="report-header"
              style={{
                borderBottom: `2px solid ${reportThemes[selectedTheme].headerBorder}`,
                padding: '1.5rem',
                backgroundColor: reportThemes[selectedTheme].headerBg,
                minHeight: logo || customFields.length > 0 || companyName || companyLogo ? '180px' : '100px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: customFields.length > 0 ? '1rem' : '0',
                position: 'relative',
                minHeight: '80px'
              }}>
                
{/* Draggable & Resizable Company Name */}
{companyName && (
  <div
    style={{
      position: 'absolute',
      left: `${companyNamePosition.x}px`,
      top: `${companyNamePosition.y}px`,
      width: `${companyNameSize.width}px`,
      display: 'inline-block',
      padding: '0.5rem',
      border: companyNamePosition.isDragging ? '2px dashed #3b82f6' : 
              showNameControls ? '2px solid #3b82f6' : '2px solid transparent',
      borderRadius: '6px',
      backgroundColor: companyNamePosition.isDragging ? '#eff6ff' : 
                       showNameControls ? '#f0f9ff' : 'transparent',
      cursor: companyNamePosition.isDragging ? 'grabbing' : 'grab',
      zIndex: companyNamePosition.isDragging ? 1000 : (showNameControls ? 999 : 2),
      transition: companyNamePosition.isDragging ? 'none' : 'all 0.2s',
      boxShadow: companyNamePosition.isDragging || showNameControls ? 
                 '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none'
    }}
    onMouseDown={handleCompanyNameMouseDown}
    onMouseEnter={() => setShowNameControls(true)}
    onMouseLeave={() => setShowNameControls(false)}
    title="Drag to reposition company name"
  >
    <div style={{
      fontSize: `${companyNameSize.fontSize}px`,
      fontWeight: '700',
      color: reportThemes[selectedTheme].titleColor,
      letterSpacing: '0.025em',
      textTransform: 'uppercase',
      pointerEvents: 'none',
      userSelect: 'none',
      wordWrap: 'break-word',
      overflow: 'hidden'
    }}>
      {companyName}
    </div>
    
    {/* Resize Controls for Company Name */}
    {showNameControls && (
      <div style={{
        position: 'absolute',
        bottom: '-30px',
        left: '0',
        display: 'flex',
        gap: '0.25rem',
        backgroundColor: '#ffffff',
        padding: '0.25rem',
        borderRadius: '4px',
        border: '1px solid #d1d5db',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        zIndex: 1001
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setCompanyNameSize(prev => ({ 
            ...prev, 
            fontSize: Math.max(10, prev.fontSize - 2) 
          }));
        }}
        style={{
          padding: '0.25rem 0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          backgroundColor: '#ffffff',
          fontSize: '0.7rem',
          cursor: 'pointer',
          fontWeight: '600'
        }}
        title="Decrease font size"
      >
        A-
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setCompanyNameSize(prev => ({ 
            ...prev, 
            fontSize: Math.min(48, prev.fontSize + 2) 
          }));
        }}
        style={{
          padding: '0.25rem 0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          backgroundColor: '#ffffff',
          fontSize: '0.7rem',
          cursor: 'pointer',
          fontWeight: '600'
        }}
        title="Increase font size"
      >
        A+
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setCompanyNameSize(prev => ({ 
            ...prev, 
            width: Math.max(100, prev.width - 20) 
          }));
        }}
        style={{
          padding: '0.25rem 0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          backgroundColor: '#ffffff',
          fontSize: '0.7rem',
          cursor: 'pointer',
          fontWeight: '600'
        }}
        title="Decrease width"
      >
        ◄
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setCompanyNameSize(prev => ({ 
            ...prev, 
            width: Math.min(600, prev.width + 20) 
          }));
        }}
        style={{
          padding: '0.25rem 0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          backgroundColor: '#ffffff',
          fontSize: '0.7rem',
          cursor: 'pointer',
          fontWeight: '600'
        }}
        title="Increase width"
      >
        ►
      </button>
    </div>
    )}
  </div>
)}

{/* Draggable & Resizable Company Logo */}
{companyLogo && (
  <div
    style={{
      position: 'absolute',
      left: `${reportCompanyLogoPosition.x}px`,
      top: `${reportCompanyLogoPosition.y}px`,
      width: `${reportCompanyLogoSize.width}px`,
      height: `${reportCompanyLogoSize.height}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.5rem',
      border: reportCompanyLogoPosition.isDragging ? '2px dashed #3b82f6' : 
              showLogoControls ? '2px solid #3b82f6' : '2px solid #e5e7eb',
      borderRadius: '6px',
      backgroundColor: 'transparent',
      cursor: reportCompanyLogoPosition.isDragging ? 'grabbing' : 'grab',
      zIndex: reportCompanyLogoPosition.isDragging ? 1000 : (showLogoControls ? 999 : 2),
      transition: reportCompanyLogoPosition.isDragging ? 'none' : 'all 0.2s',
      boxShadow: reportCompanyLogoPosition.isDragging || showLogoControls ? 
                 '0 4px 6px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}
    onMouseDown={handleReportCompanyLogoMouseDown}
    onMouseEnter={() => setShowLogoControls(true)}
    onMouseLeave={() => setShowLogoControls(false)}
    title="Drag to reposition company logo"
  >
    <img 
      src={companyLogo} 
      alt="Company Logo" 
      style={{ 
        maxWidth: '100%', 
        maxHeight: '100%',
        objectFit: 'contain',
        pointerEvents: 'none'
      }}
    />
    
    {/* Resize Controls for Company Logo */}
    {showLogoControls && (
      <div style={{
        position: 'absolute',
        bottom: '-30px',
        left: '0',
        display: 'flex',
        gap: '0.25rem',
        backgroundColor: '#ffffff',
        padding: '0.25rem',
        borderRadius: '4px',
        border: '1px solid #d1d5db',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        zIndex: 1001
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setReportCompanyLogoSize(prev => ({ 
            width: Math.max(50, prev.width - 10),
            height: Math.max(30, prev.height - 6)
          }));
        }}
        style={{
          padding: '0.25rem 0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          backgroundColor: '#ffffff',
          fontSize: '0.7rem',
          cursor: 'pointer',
          fontWeight: '600'
        }}
        title="Decrease size"
      >
        -
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setReportCompanyLogoSize(prev => ({ 
            width: Math.min(400, prev.width + 10),
            height: Math.min(200, prev.height + 6)
          }));
        }}
        style={{
          padding: '0.25rem 0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          backgroundColor: '#ffffff',
          fontSize: '0.7rem',
          cursor: 'pointer',
          fontWeight: '600'
        }}
        title="Increase size"
      >
        +
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setReportCompanyLogoSize(prev => ({ 
            ...prev, 
            width: Math.max(50, prev.width - 10)
          }));
        }}
        style={{
          padding: '0.25rem 0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          backgroundColor: '#ffffff',
          fontSize: '0.7rem',
          cursor: 'pointer',
          fontWeight: '600'
        }}
        title="Decrease width"
      >
        ◄
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setReportCompanyLogoSize(prev => ({ 
            ...prev, 
            width: Math.min(400, prev.width + 10)
          }));
        }}
        style={{
          padding: '0.25rem 0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          backgroundColor: '#ffffff',
          fontSize: '0.7rem',
          cursor: 'pointer',
          fontWeight: '600'
        }}
        title="Increase width"
      >
        ►
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setReportCompanyLogoSize(prev => ({ 
            ...prev, 
            height: Math.max(30, prev.height - 6)
          }));
        }}
        style={{
          padding: '0.25rem 0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          backgroundColor: '#ffffff',
          fontSize: '0.7rem',
          cursor: 'pointer',
          fontWeight: '600'
        }}
        title="Decrease height"
      >
        ▼
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setReportCompanyLogoSize(prev => ({ 
            ...prev, 
            height: Math.min(200, prev.height + 6)
          }));
        }}
        style={{
          padding: '0.25rem 0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          backgroundColor: '#ffffff',
          fontSize: '0.7rem',
          cursor: 'pointer',
          fontWeight: '600'
        }}
        title="Increase height"
      >
        ▲
      </button>
    </div>
    )}

    {/* Resize Handles */}
    {showLogoControls && (
      <>
        {/* Corner handles */}
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            width: '8px',
            height: '8px',
            backgroundColor: '#3b82f6',
            border: '1px solid white',
            borderRadius: '50%',
            cursor: 'nw-resize',
            zIndex: 1002
          }}
          onMouseDown={(e) => handleLogoResizeMouseDown(e, 'nw')}
        />
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '8px',
            height: '8px',
            backgroundColor: '#3b82f6',
            border: '1px solid white',
            borderRadius: '50%',
            cursor: 'ne-resize',
            zIndex: 1002
          }}
          onMouseDown={(e) => handleLogoResizeMouseDown(e, 'ne')}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '-4px',
            width: '8px',
            height: '8px',
            backgroundColor: '#3b82f6',
            border: '1px solid white',
            borderRadius: '50%',
            cursor: 'sw-resize',
            zIndex: 1002
          }}
          onMouseDown={(e) => handleLogoResizeMouseDown(e, 'sw')}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            width: '8px',
            height: '8px',
            backgroundColor: '#3b82f6',
            border: '1px solid white',
            borderRadius: '50%',
            cursor: 'se-resize',
            zIndex: 1002
          }}
          onMouseDown={(e) => handleLogoResizeMouseDown(e, 'se')}
        />
      </>
    )}
  </div>
)}
                
                {/* Draggable Logo (Original) */}
                {logo && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${logoPosition.x}px`,
                      top: `${logoPosition.y}px`,
                      width: '120px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.5rem',
                      border: logoPosition.isDragging ? '2px dashed #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '4px',
                      backgroundColor: logoPosition.isDragging ? '#eff6ff' : '#fafafa',
                      cursor: logoPosition.isDragging ? 'grabbing' : 'grab',
                      zIndex: logoPosition.isDragging ? 1000 : 1,
                      transition: logoPosition.isDragging ? 'none' : 'border-color 0.2s, background-color 0.2s',
                      boxShadow: logoPosition.isDragging ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none'
                    }}
                    onMouseDown={handleLogoMouseDown}
                    title="Drag to reposition logo"
                  >
                    <img 
                      src={logo} 
                      alt="Company Logo" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                )}
                
                {/* Empty space - no default headings */}
                <div style={{ 
                  flex: 1, 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '0 1rem',
                  zIndex: 0
                }}>
                  {/* Removed default "Inspection Report" and "Quality Management System" headings */}
                </div>
                
                <div style={{ width: '120px' }}></div>
              </div>
              
              {/* Custom Fields */}
              {customFields.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: customFields.length === 1 ? '1fr' : 
                                       customFields.length === 2 ? 'repeat(2, 1fr)' : 
                                       'repeat(3, 1fr)',
                  gap: '0.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #d1d5db'
                }}>
                  {customFields.map((field) => (
                    <div key={field.id} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.125rem',
                      padding: '0.5rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {field.name}
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#111827',
                        wordBreak: 'break-word'
                      }}>
                        {field.value || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
           {/* Position and Size Reset Buttons */}
<div style={{
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  display: 'flex',
  gap: '0.25rem',
  flexWrap: 'wrap',
  maxWidth: '250px',
  zIndex: 3
}}>
  {logo && (
    <button
      onClick={() => setLogoPosition({ x: 0, y: 0, isDragging: false })}
      style={{
        padding: '0.25rem 0.5rem',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        backgroundColor: '#ffffff',
        color: '#6b7280',
        fontSize: '0.625rem',
        cursor: 'pointer',
        fontWeight: '600'
      }}
      title="Reset logo position"
    >
      Reset Logo
    </button>
  )}
</div>
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              padding: '1.5rem',
              overflow: 'auto'
            }}>
              {reportLoading && (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e5e7eb',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1rem'
                  }}></div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading report data...</div>
                </div>
              )}

              {reportError && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem',
                  color: '#ef4444',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Error loading report
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>{reportError}</div>
                </div>
              )}

              {!reportLoading && !reportError && reportData && (
                <div>
                  {/* Part Information */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ 
                      margin: '0 0 0.75rem 0', 
                      fontSize: '1rem', 
                      fontWeight: '700', 
                      color: '#111827',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                      borderBottom: '2px solid #e5e7eb',
                      paddingBottom: '0.5rem'
                    }}>
                      Part Information
                    </h3>
                    <div style={{
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: `repeat(${4 + customHeaders.length}, 1fr)`,
                        gap: '1rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>
                            PART NUMBER
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                            {reportData.part_no || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>
                            PART NAME
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                            {reportData.part_name || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>
                            PROJECT
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                            {reportData.boc?.project?.name || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>
                            QTY
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                            {reportData.boc?.quantity || 'N/A'}
                          </div>
                        </div>

                        {/* Custom Headers */}
                        {customHeaders.map((header, index) => (
                          <div key={index}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem' }}>
                              {header.name.toUpperCase()}
                            </div>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                              {header.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Part Drawing */}
                  {pdfData && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ 
                        margin: '0 0 0.75rem 0', 
                        fontSize: '1rem', 
                        fontWeight: '700', 
                        color: '#111827',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em',
                        borderBottom: '2px solid #e5e7eb',
                        paddingBottom: '0.5rem'
                      }}>
                        Part Drawing
                      </h3>
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        overflow: 'hidden'
                      }}>
                        <PDFViewer
                          pdfData={pdfData}
                          pdfDimensions={pdfDimensions}
                          currentPage={currentPage || 1}
                          scale={1.2}
                          boundingBoxes={useBboxStore.getState().boundingBoxes}
                          notes={[]}
                          isSelectionMode={false}
                          isPanMode={false}
                          isNotesMode={false}
                          isStampMode={false}
                          rotation={0}
                        />
                      </div>
                    </div>
                  )}

                  {/* Page Break for Inspection Data */}
                  <div style={{ 
                    pageBreakAfter: 'always',
                    marginBottom: '2rem',
                    height: '20px'
                  }}></div>

                  {/* Editable Table with Context Menu */}
                  {tableData.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ 
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: '#111827',
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em',
                        borderBottom: '2px solid #e5e7eb',
                        paddingBottom: '0.5rem'
                      }}>
                        <span>Inspection Data</span>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#3b82f6',
                          textTransform: 'none',
                          letterSpacing: 'normal'
                        }}>
                          {selectedQuantity === '' ? 'All Qty' : 
                           selectedQuantity === 'consolidate' ? 'consolidate' : 
                           `Qty${selectedQuantity}`}
                        </span>
                        {isEditing && (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#059669',
                            marginLeft: '0.5rem'
                          }}>
                            (Editing Mode - Right-click for options)
                          </span>
                        )}
                      </h3>

                      <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        fontSize: '0.75rem'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb' }}>
                            {tableHeaders.map((header, colIndex) => (
                              <th 
                                key={colIndex}
                                onContextMenu={(e) => isEditing && handleContextMenu(e, null, colIndex)}
                                style={{ 
                                  padding: '0.5rem', 
                                  textAlign: 'left', 
                                  fontWeight: '700', 
                                  color: '#374151', 
                                  borderBottom: '2px solid #e5e7eb', 
                                  borderRight: '1px solid #e5e7eb', 
                                  fontSize: '0.7rem', 
                                  textTransform: 'uppercase',
                                  cursor: isEditing ? 'context-menu' : 'default'
                                }}
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.map((row, rowIndex) => (
                            <tr 
                              key={rowIndex} 
                              style={{ backgroundColor: rowIndex % 2 === 0 ? 'white' : '#fafafa' }}
                            >
                              {tableHeaders.map((header, colIndex) => {
                                const keys = ['id', 'nominal', 'tolerance', 'type', 'm1', 'm2', 'm3', 'mean', 'status'];
                                const cellKey = keys[colIndex];
                                const cellValue = colIndex === 0 ? (rowIndex + 1).toString() : (row[cellKey] || 'N/A');
                                
                                return (
                                  <td 
                                    key={colIndex}
                                    onContextMenu={(e) => isEditing && handleContextMenu(e, rowIndex, colIndex)}
                                    style={{ 
                                      padding: '0.5rem', 
                                      color: '#374151', 
                                      borderBottom: '1px solid #e5e7eb', 
                                      borderRight: colIndex === tableHeaders.length - 1 ? 'none' : '1px solid #e5e7eb',
                                      textAlign: colIndex >= 3 && colIndex <= 6 ? 'center' : 'left',
                                      backgroundColor: isEditing ? '#f9fafb' : 'transparent',
                                      cursor: isEditing ? 'context-menu' : 'default'
                                    }}
                                    contentEditable={isEditing && colIndex !== 8}
                                    suppressContentEditableWarning={true}
                                    onBlur={(e) => {
                                      if (isEditing && colIndex !== 8) {
                                        const newData = [...tableData];
                                        newData[rowIndex][cellKey] = e.currentTarget.textContent;
                                        setTableData(newData);
                                      }
                                    }}
                                  >
                                    {colIndex === 8 ? (
                                      <span style={{ 
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: '600',
                                        backgroundColor: cellValue === 'GO' ? '#d1fae5' : cellValue === 'NO-GO' ? '#fee2e2' : '#f3f4f6',
                                        color: cellValue === 'GO' ? '#065f46' : cellValue === 'NO-GO' ? '#991b1b' : '#6b7280',
                                        display: 'inline-block'
                                      }}>
                                        {cellValue}
                                      </span>
                                    ) : (
                                      cellValue
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div style={{
              borderTop: '2px solid #000000',
              padding: '1rem 1.5rem',
              backgroundColor: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              <span>Generated on {new Date().toLocaleDateString()}</span>
              <span>{partData.name || 'Direct Part'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {CustomHeadersModal()}
      {ThemesModal()}
      {ContextMenu()}
    </div>
  );
};

export default Report;