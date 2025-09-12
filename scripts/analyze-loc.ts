#!/usr/bin/env tsx

/**
 * Analyze Lines of Code (LOC) for important project files
 */

import { readFileSync, statSync } from 'fs';
import { join } from 'path';

interface FileAnalysis {
  path: string;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  size: number;
}

interface CategoryAnalysis {
  category: string;
  files: FileAnalysis[];
  totalLines: number;
  totalCodeLines: number;
  totalFiles: number;
}

function analyzeFile(filePath: string): FileAnalysis {
  try {
    const content = readFileSync(filePath, 'utf8');
    const stats = statSync(filePath);
    const lines = content.split('\n');
    
    let codeLines = 0;
    let commentLines = 0;
    let blankLines = 0;
    
    let inBlockComment = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === '') {
        blankLines++;
      } else if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/**') || trimmed.startsWith('*/')) {
        commentLines++;
      } else if (trimmed.startsWith('/*')) {
        inBlockComment = true;
        commentLines++;
      } else if (trimmed.endsWith('*/')) {
        inBlockComment = false;
        commentLines++;
      } else if (inBlockComment) {
        commentLines++;
      } else {
        codeLines++;
      }
    }
    
    return {
      path: filePath,
      totalLines: lines.length,
      codeLines,
      commentLines,
      blankLines,
      size: stats.size
    };
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
    return {
      path: filePath,
      totalLines: 0,
      codeLines: 0,
      commentLines: 0,
      blankLines: 0,
      size: 0
    };
  }
}

function analyzeProject() {
  console.log('📊 YogVaidya Project - Lines of Code Analysis');
  console.log('='.repeat(50));
  
  // Important file categories
  const categories = [
    {
      name: 'API Routes',
      pattern: 'src/app/api/**/*.ts',
      files: [
        'src/app/api/admin/update-session-status/route.ts',
        'src/app/api/mentor/book-session/route.ts',
        'src/app/api/mentor/timeslots/route.ts',
        'src/app/api/sessions/[sessionId]/start/route.ts',
        'src/app/api/sessions/[sessionId]/complete/route.ts',
        'src/app/api/subscription/route.ts',
        'src/app/api/users/sessions/route.ts',
        'src/app/api/auth/[...all]/route.ts'
      ]
    },
    {
      name: 'Server Logic',
      pattern: 'src/lib/server/**/*.ts',
      files: [
        'src/lib/server/user-sessions-server.ts',
        'src/lib/server/user-mentor-server.ts',
        'src/lib/server/mentor-sessions-server.ts',
        'src/lib/server/mentor-overview-server.ts',
        'src/lib/server/billing-server.ts'
      ]
    },
    {
      name: 'Dashboard Components',
      pattern: 'src/components/dashboard/**/*.tsx',
      files: [
        'src/components/dashboard/user/sections/classes-section.tsx',
        'src/components/dashboard/user/sections/mentors-section.tsx',
        'src/components/dashboard/mentor/sections/sessions-section.tsx',
        'src/components/dashboard/admin/sections/subscription-management-section.tsx',
        'src/components/dashboard/shared/unified-dashboard.tsx'
      ]
    },
    {
      name: 'Core Services',
      pattern: 'src/lib/services/**/*.ts',
      files: [
        'src/lib/services/session-status-service.ts',
        'src/lib/services/razorpay-service.ts',
        'src/lib/services/email.ts',
        'src/lib/services/mentor-sync.ts'
      ]
    },
    {
      name: 'Core Libraries',
      pattern: 'src/lib/*.ts',
      files: [
        'src/lib/subscriptions.ts',
        'src/lib/students.ts',
        'src/lib/auth-client.ts',
        'src/lib/types.ts'
      ]
    },
    {
      name: 'UI Components',
      pattern: 'src/components/ui/**/*.tsx',
      files: [
        'src/components/ui/button.tsx',
        'src/components/ui/card.tsx',
        'src/components/ui/form.tsx',
        'src/components/ui/table.tsx'
      ]
    }
  ];
  
  const allAnalyses: CategoryAnalysis[] = [];
  
  for (const category of categories) {
    console.log(`\n📁 ${category.name}:`);
    console.log('-'.repeat(30));
    
    const analyses: FileAnalysis[] = [];
    let totalLines = 0;
    let totalCodeLines = 0;
    
    for (const file of category.files) {
      try {
        const analysis = analyzeFile(file);
        analyses.push(analysis);
        totalLines += analysis.totalLines;
        totalCodeLines += analysis.codeLines;
        
        const fileName = file.split('/').pop() || file;
        console.log(`  ${fileName.padEnd(35)} | ${analysis.totalLines.toString().padStart(4)} lines | ${analysis.codeLines.toString().padStart(4)} code`);
      } catch (error) {
        console.log(`  ${file.padEnd(35)} | ERROR: File not found`);
      }
    }
    
    console.log(`  ${'TOTAL'.padEnd(35)} | ${totalLines.toString().padStart(4)} lines | ${totalCodeLines.toString().padStart(4)} code`);
    
    allAnalyses.push({
      category: category.name,
      files: analyses,
      totalLines,
      totalCodeLines,
      totalFiles: analyses.length
    });
  }
  
  // Overall summary
  console.log('\n📈 OVERALL SUMMARY:');
  console.log('='.repeat(50));
  
  let grandTotalLines = 0;
  let grandTotalCodeLines = 0;
  let grandTotalFiles = 0;
  
  for (const analysis of allAnalyses) {
    grandTotalLines += analysis.totalLines;
    grandTotalCodeLines += analysis.totalCodeLines;
    grandTotalFiles += analysis.totalFiles;
    
    console.log(`${analysis.category.padEnd(25)} | ${analysis.totalFiles.toString().padStart(3)} files | ${analysis.totalLines.toString().padStart(5)} lines | ${analysis.totalCodeLines.toString().padStart(5)} code`);
  }
  
  console.log('-'.repeat(50));
  console.log(`${'GRAND TOTAL'.padEnd(25)} | ${grandTotalFiles.toString().padStart(3)} files | ${grandTotalLines.toString().padStart(5)} lines | ${grandTotalCodeLines.toString().padStart(5)} code`);
  
  // Additional insights
  console.log('\n💡 INSIGHTS:');
  console.log('-'.repeat(30));
  console.log(`• Average lines per file: ${Math.round(grandTotalLines / grandTotalFiles)}`);
  console.log(`• Code efficiency: ${Math.round((grandTotalCodeLines / grandTotalLines) * 100)}% code vs comments/blanks`);
  console.log(`• Largest category: ${allAnalyses.reduce((max, curr) => curr.totalLines > max.totalLines ? curr : max).category}`);
}

// Run the analysis
analyzeProject();
