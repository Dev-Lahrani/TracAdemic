const axios = require('axios');

// Simple code analysis patterns
const securityPatterns = {
  sqlInjection: /(['"])(?:\\.|(?!\1)[^\\])*?\1\s*(?:\+|\||%)?\s*(?:\$|@|:|db\.query|query\()/gi,
  xssPattern: /innerHTML|outerHTML|write\(/gi,
  evalPattern: /eval\s*\(/gi,
  unsafeRegex: /new\s+RegExp\(/gi,
  prototypePollution: /__proto__|constructor\s*\[/gi,
};

const codeQualityRules = [
  { name: 'lineLength', pattern: /.{101,}/, message: 'Line exceeds 100 characters' },
  { name: 'todoComment', pattern: /TODO|FIXME/, message: 'Contains TODO/FIXME comments' },
  { name: 'debugCode', pattern: /console\.log|debugger/, message: 'Contains debug code' },
];

// @desc    Review code snippets
// @route   POST /api/code-review/review
// @access  Private
const reviewCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const securityIssues = [];
    const codeQualityIssues = [];
    const suggestions = [];

    // Security analysis
    for (const [type, pattern] of Object.entries(securityPatterns)) {
      if (pattern.test(code)) {
        const severity = type === 'sqlInjection' || type === 'evalPattern' ? 'critical' : 'high';
        securityIssues.push({
          type,
          severity,
          message: getSecurityMessage(type),
          line: getLineNumber(code, pattern),
        });
      }
    }

    // Code quality analysis
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      codeQualityRules.forEach(rule => {
        if (rule.pattern.test(line)) {
          codeQualityIssues.push({
            type: rule.name,
            message: rule.message,
            line: index + 1,
            snippet: line.trim().substring(0, 50),
          });
        }
      });

      // Suggest improvements for long lines
      if (line.length > 80) {
        suggestions.push({
          type: 'refactor',
          message: 'Consider breaking this line for better readability',
          line: index + 1,
        });
      }
    });

    // Complexity analysis (basic)
    const complexity = calculateComplexity(code);

    // Generate AI-style summary
    const summary = generateReviewSummary(codeQualityIssues, securityIssues, suggestions);

    res.json({
      success: true,
      review: {
        summary,
        securityIssues,
        codeQualityIssues,
        suggestions,
        complexity: {
          score: complexity,
          rating: complexity < 5 ? 'Low' : complexity < 10 ? 'Medium' : 'High',
        },
        score: calculateScore(codeQualityIssues.length, securityIssues.length),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review GitHub pull request
// @route   POST /api/code-review/pull-request/:prId
// @access  Private
const reviewPullRequest = async (req, res) => {
  try {
    const { prId } = req.params;
    const { repo, token, files } = req.body;

    const reviewComments = [];

    files.forEach(file => {
      const fileReview = analyzeFile(file);
      reviewComments.push({
        file: file.filename,
        comments: fileReview.comments,
        summary: fileReview.summary,
      });
    });

    res.json({
      success: true,
      prId,
      review: {
        overallRating: 'Good',
        summary: `PR reviewed. ${reviewComments.length} files analyzed.`,
        files: reviewComments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check code quality for a project
// @route   POST /api/code-review/quality/:projectId
// @access  Private
const checkCodeQuality = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { codeFiles } = req.body;

    const results = codeFiles.map(file => ({
      filename: file.name,
      linesOfCode: file.content.split('\n').length,
      complexity: calculateComplexity(file.content),
      issues: findIssues(file.content),
      suggestions: findSuggestions(file.content),
    }));

    const avgComplexity = results.reduce((sum, r) => sum + r.complexity, 0) / results.length;

    res.json({
      success: true,
      projectId,
      qualityReport: {
        files: results,
        averageComplexity: avgComplexity,
        overallQuality: avgComplexity < 7 ? 'Good' : avgComplexity < 10 ? 'Fair' : 'Needs Improvement',
        totalFiles: results.length,
        totalLines: results.reduce((sum, r) => sum + r.linesOfCode, 0),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Suggest code improvements
// @route   POST /api/code-review/improvements/:projectId
// @access  Private
const suggestImprovements = async (req, res) => {
  try {
    const { code } = req.body;

    const suggestions = [
      {
        type: 'optimization',
        issue: 'Variable declared inside loop',
        suggestion: 'Move variable declaration outside the loop for better performance',
        codeBefore: 'for (let i = 0; i < 10; i++) { const temp = calculate(i); }',
        codeAfter: 'let temp; for (let i = 0; i < 10; i++) { temp = calculate(i); }',
      },
      {
        type: 'readability',
        issue: 'Long nested if statements',
        suggestion: 'Use early returns or extract to functions',
        codeBefore: 'if (a) { if (b) { if (c) { /* deep nesting */ } } }',
        codeAfter: 'if (!a) return; if (!b) return; if (!c) return; /* flat structure */',
      },
    ];

    res.json({
      success: true,
      improvements: suggestions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper functions
function getSecurityMessage(type) {
  const messages = {
    sqlInjection: 'Potential SQL injection vulnerability',
    xssPattern: 'Potential XSS vulnerability',
    evalPattern: 'Use of eval() is dangerous',
    unsafeRegex: 'Potential ReDoS vulnerability',
    prototypePollution: 'Potential prototype pollution',
  };
  return messages[type] || 'Security concern detected';
}

function getLineNumber(code, pattern) {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) return i + 1;
  }
  return 1;
}

function calculateComplexity(code) {
  const lines = code.split('\n');
  let complexity = 0;
  lines.forEach(line => {
    if (line.includes('if ') || line.includes('for ') || line.includes('while ')) complexity++;
    if (line.includes('&&') || line.includes('||')) complexity++;
    if (line.includes('function ') || line.includes('=>')) complexity++;
  });
  return complexity;
}

function generateReviewSummary(qualityIssues, securityIssues, suggestions) {
  const total = qualityIssues.length + securityIssues.length;
  if (total === 0) return 'Code looks great! No issues detected.';
  if (securityIssues.length > 0) {
    return `⚠️ ${securityIssues.length} security issue(s) found. Review immediately before deploying.`;
  }
  return `${total} issue(s) found. ${suggestions.length} suggestions for improvement.`;
}

function calculateScore(qualityIssues, securityIssues) {
  let score = 100;
  score -= qualityIssues * 2;
  score -= securityIssues * 10;
  return Math.max(0, score);
}

function analyzeFile(file) {
  const content = file.content || '';
  const comments = [];
  
  if (content.includes('TODO') || content.includes('FIXME')) {
    comments.push({ type: 'warning', message: 'Contains TODO/FIXME comments', line: 1 });
  }
  
  if (content.length > 10000) {
    comments.push({ type: 'info', message: 'Large file - consider splitting' });
  }

  return {
    summary: `${comments.length} comments`,
    comments,
  };
}

function findIssues(code) {
  const issues = [];
  const lines = code.split('\n');
  lines.forEach((line, i) => {
    if (line.length > 100) {
      issues.push({ type: 'style', message: 'Line too long', line: i + 1 });
    }
  });
  return issues;
}

function findSuggestions(code) {
  return [
    { message: 'Add JSDoc comments for functions' },
    { message: 'Consider using const instead of let where possible' },
  ];
}

module.exports = {
  reviewCode,
  reviewPullRequest,
  checkCodeQuality,
  suggestImprovements,
};
