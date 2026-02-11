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
      
      // Helper to split note text by numbered patterns (same as NotesTable)
      const splitNoteText = (text) => {
        if (!text) return [];
        // Remove "NOTE:" prefix if present
        let cleanedText = text.replace(/^NOTE:\s*/i, '').trim();
        // Split by numbered patterns (1., 2., 3., etc.)
        let items = cleanedText.split(/\n?\s*\d+\.\s*/)
                               .filter(item => item.trim().length > 0)
                               .map(item => item.trim());
        return items;
      };
      
      let noteNumber = 1;
      notes.forEach((note) => {
        const noteText = String(note.note_text || '');
        const items = splitNoteText(noteText);
        
        items.forEach((item) => {
          if (!item) return;
          
          if (noteY > pageHeight - margin - 30) {
            pdf.addPage();
            noteY = margin;
          }
          
          // Add note number in bold
          pdf.setFont(undefined, 'bold');
          pdf.text(`${noteNumber}.`, margin, noteY);
          pdf.setFont(undefined, 'normal');
          
          // Display note text
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
