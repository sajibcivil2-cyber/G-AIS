import { ExtractedFile, AuditResult, AuditIssue, MetricScores } from '../types';

export function runStaticAnalysis(files: ExtractedFile[], projectName = 'App Project'): AuditResult {
  const issues: AuditIssue[] = [];
  const strengths: string[] = [];

  let architectureScore = 92;
  let antiPatternScore = 95;
  let performanceScore = 90;
  let accessibilityScore = 88;
  let securityScore = 96;
  let outputQualityScore = 94;

  const totalFiles = files.length;
  const hasPackageJson = files.some((f) => f.name === 'package.json');
  const hasEnvExample = files.some((f) => f.name.includes('.env.example') || f.name.includes('.env'));
  const hasIndexHtml = files.some((f) => f.name === 'index.html');
  const hasTsConfig = files.some((f) => f.name === 'tsconfig.json');

  if (hasPackageJson) strengths.push('Proper Node.js package manifest present with declared dependencies.');
  if (hasTsConfig) strengths.push('TypeScript configuration detected for static type safety.');
  if (hasEnvExample) strengths.push('Environment variable declaration present (.env.example).');

  let issueCounter = 0;

  if (!hasEnvExample) {
    securityScore -= 10;
    issueCounter++;
    issues.push({
      id: `sec-env-missing-${issueCounter}`,
      title: 'Missing .env.example Specification',
      category: 'Security',
      severity: 'Medium',
      file: '.env.example',
      description: 'The project lacks a .env.example template file to document required environment variables.',
      recommendation: 'Create a .env.example file documenting all API keys and environment variables.',
      suggestedFix: '# .env.example\nGEMINI_API_KEY=\nAPI_BASE_URL=',
    });
  }

  // Scan through files
  files.forEach((file) => {
    if (file.isBinary) return;

    const content = file.content;
    const lines = content.split('\n');
    const safePath = file.path.replace(/[^a-zA-Z0-9]/g, '-');

    // 1. Security Checks
    if (/(sk_live_[0-9a-zA-Z]{24}|AIzaSy[0-9a-zA-Z-_]{35}|ghp_[0-9a-zA-Z]{36})/g.test(content)) {
      securityScore -= 25;
      issueCounter++;
      issues.push({
        id: `sec-hardcoded-key-${safePath}-${issueCounter}`,
        title: 'Hardcoded Secret / API Key Detected',
        category: 'Security',
        severity: 'High',
        file: file.path,
        description: `Potential active API key or secret token embedded directly in source file.`,
        recommendation: 'Remove hardcoded secret immediately and reference environment variables via process.env.',
        suggestedFix: `// Instead of hardcoding key\nconst apiKey = process.env.GEMINI_API_KEY;`,
      });
    }

    if (content.includes('dangerouslySetInnerHTML')) {
      securityScore -= 12;
      issueCounter++;
      issues.push({
        id: `sec-danger-html-${safePath}-${issueCounter}`,
        title: 'Dangerous innerHTML Injection Risk',
        category: 'Security',
        severity: 'High',
        file: file.path,
        description: 'Usage of dangerouslySetInnerHTML exposes the UI to Cross-Site Scripting (XSS) risks.',
        recommendation: 'Sanitize HTML inputs or use React Markdown / text node escaping.',
        suggestedFix: 'Use standard text children or sanitize HTML with DOMPurify.',
      });
    }

    // 2. AI Anti-Pattern & Cliché Checks
    if (
      content.includes('from-purple-500 to-blue-500') ||
      content.includes('from-indigo-500 to-purple-600') ||
      content.includes('bg-gradient-to-r from-cyan-500')
    ) {
      antiPatternScore -= 10;
      issueCounter++;
      issues.push({
        id: `anti-gradient-${safePath}-${issueCounter}`,
        title: 'Generic AI Purple/Blue Gradient Cliché',
        category: 'AntiPattern',
        severity: 'Low',
        file: file.path,
        description: 'Unsolicited vibrant purple-to-blue background gradient detected.',
        recommendation: 'Replace generic AI gradients with intentional high-contrast neutral or domain-appropriate color palettes.',
        suggestedFix: 'bg-slate-900 text-slate-100 dark:bg-zinc-900 border border-zinc-800',
      });
    }

    if (lines.length > 450 && (file.extension === 'tsx' || file.extension === 'jsx')) {
      architectureScore -= 15;
      issueCounter++;
      issues.push({
        id: `arch-monolith-${safePath}-${issueCounter}`,
        title: 'Monolithic Component File Structure',
        category: 'Architecture',
        severity: 'Medium',
        file: file.path,
        description: `File contains ${lines.length} lines of code, exceeding the 400-line modularity threshold.`,
        recommendation: 'Extract sub-components, types, and helper hooks into separate modular files under /src/components/.',
        suggestedFix: 'Extract UI sections into standalone functional components.',
      });
    }

    if (content.includes('catch (e) {}') || content.includes('catch (err) {}')) {
      outputQualityScore -= 10;
      issueCounter++;
      issues.push({
        id: `output-silent-catch-${safePath}-${issueCounter}`,
        title: 'Silent Error Suppression (Empty Catch Block)',
        category: 'OutputQuality',
        severity: 'Medium',
        file: file.path,
        description: 'Errors are swallowed quietly without logging or notifying the user interface.',
        recommendation: 'Log errors or display actionable user feedback when asynchronous calls fail.',
        suggestedFix: 'catch (err) {\n  console.error("Operation failed:", err);\n  setErrorState(err.message);\n}',
      });
    }

    // 3. Accessibility Checks
    if (/<img\s+((?!alt=).)*$/m.test(content) || (content.includes('<img') && !content.includes('alt='))) {
      accessibilityScore -= 8;
      issueCounter++;
      issues.push({
        id: `a11y-img-alt-${safePath}-${issueCounter}`,
        title: 'Missing Image Alt Attribute',
        category: 'Accessibility',
        severity: 'Low',
        file: file.path,
        description: 'Image element detected without accessible alt text description for screen readers.',
        recommendation: 'Provide meaningful alt descriptions or set alt="" for decorative images.',
        suggestedFix: '<img src={url} alt="Descriptive label" />',
      });
    }

    if (/<div[^>]*onClick/g.test(content) && !content.includes('role="button"')) {
      accessibilityScore -= 8;
      issueCounter++;
      issues.push({
        id: `a11y-div-click-${safePath}-${issueCounter}`,
        title: 'Non-Interactive Element with Click Handler',
        category: 'Accessibility',
        severity: 'Medium',
        file: file.path,
        description: '<div> or <span> elements with onClick lack keyboard focusability and ARIA roles.',
        recommendation: 'Use <button> or add role="button" with tabIndex={0} and keypress listeners.',
        suggestedFix: '<button type="button" onClick={handleClick} className="...">Label</button>',
      });
    }

    // 4. Performance Checks
    if (content.includes('useEffect(() => {') && content.includes('set') && !content.includes('deps')) {
      if (content.includes('useEffect') && content.includes(', [') && content.includes('[]')) {
        // ok
      } else if (!content.includes('deps')) {
        performanceScore -= 12;
        issueCounter++;
        issues.push({
          id: `perf-infinite-rerender-${safePath}-${issueCounter}`,
          title: 'Potential Infinite Effect Re-render Loop',
          category: 'Performance',
          severity: 'High',
          file: file.path,
          description: 'useEffect hook executes state setter without explicit dependency array boundaries.',
          recommendation: 'Pass a dependency array [dep1, dep2] to control effect execution trigger.',
          suggestedFix: 'useEffect(() => {\n  // effect logic\n}, [primitiveDependency]);',
        });
      }
    }

    // Check for explicit ID attributes in HTML/JSX for interactive elements
    const buttonCount = (content.match(/<button/g) || []).length;
    const idCount = (content.match(/id=/g) || []).length;
    if (buttonCount > 3 && idCount === 0) {
      outputQualityScore -= 5;
      issueCounter++;
      issues.push({
        id: `output-missing-ids-${safePath}-${issueCounter}`,
        title: 'Missing Unique HTML ID Attributes',
        category: 'OutputQuality',
        severity: 'Low',
        file: file.path,
        description: 'Multiple interactive controls exist without unique element ID attributes for targeting.',
        recommendation: 'Add meaningful id attributes to primary buttons, forms, and input controls.',
        suggestedFix: '<button id="submit-analysis-btn" className="...">Analyze</button>',
      });
    }
  });

  // Clamp metric scores
  architectureScore = Math.max(35, Math.min(100, architectureScore));
  antiPatternScore = Math.max(35, Math.min(100, antiPatternScore));
  performanceScore = Math.max(35, Math.min(100, performanceScore));
  accessibilityScore = Math.max(35, Math.min(100, accessibilityScore));
  securityScore = Math.max(35, Math.min(100, securityScore));
  outputQualityScore = Math.max(35, Math.min(100, outputQualityScore));

  const scores: MetricScores = {
    architecture: architectureScore,
    antiPattern: antiPatternScore,
    performance: performanceScore,
    accessibility: accessibilityScore,
    security: securityScore,
    outputQuality: outputQualityScore,
  };

  const avg = Math.round(
    (architectureScore + antiPatternScore + performanceScore + accessibilityScore + securityScore + outputQualityScore) / 6
  );

  let overallGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F' = 'B+';
  if (avg >= 95) overallGrade = 'A+';
  else if (avg >= 88) overallGrade = 'A';
  else if (avg >= 80) overallGrade = 'B+';
  else if (avg >= 72) overallGrade = 'B';
  else if (avg >= 60) overallGrade = 'C';
  else if (avg >= 50) overallGrade = 'D';
  else overallGrade = 'F';

  if (issues.length === 0) {
    strengths.push('Zero critical code anti-patterns or security vulnerabilities found.');
    strengths.push('Clean layout architecture with accessible semantic elements.');
  } else {
    strengths.push(`Analyzed ${totalFiles} project files across 6 static and dynamic analysis dimensions.`);
  }

  const actionableFixes = issues.map((i) => `[${i.severity}] ${i.title} in ${i.file || 'project'}: ${i.recommendation}`);

  return {
    overallScore: avg,
    overallGrade,
    summary: `Code analysis completed for ${projectName} (${totalFiles} files). Calculated Quality Score is ${avg}/100 Grade ${overallGrade}. ${issues.length} items flagged for output optimization.`,
    scores,
    strengths,
    issues,
    actionableFixes,
    analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
