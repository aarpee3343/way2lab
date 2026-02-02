'use server';

export async function generateSampleCSV(selectedFields: string[], corporateId: number) {
  // Mandatory Fields
  const headers = ["name", "email", "phone", "dateOfBirth", "gender", "corporateId"];
  
  // Add Optional Fields selected by Admin
  const finalHeaders = [...new Set([...headers, ...selectedFields])];
  
  // Create a single row of sample data including the corporate ID
  const sampleData = finalHeaders.map(h => {
    if (h === 'corporateId') return corporateId;
    if (h === 'gender') return 'Male/Female';
    if (h === 'dateOfBirth') return 'YYYY-MM-DD';
    return `Sample_${h}`;
  });

  const csvContent = [finalHeaders.join(','), sampleData.join(',')].join('\n');
  return csvContent;
}