import React, { useMemo, useState, useEffect } from "react";
import faqData from "../data/faq.json";
import { userAPI } from "../utils/api";

function calculateTax(oldRegimeInputs, newRegimeInputs) {
  // Very simplified placeholder calculator; replace with backend-calibrated rules.
  const computeSlabTax = (taxable, slabs) => {
    let tax = 0;
    let remaining = taxable;
    for (const [limit, rate] of slabs) {
      const chunk = Math.min(remaining, limit);
      if (chunk <= 0) break;
      tax += chunk * rate;
      remaining -= chunk;
    }
    if (remaining > 0) tax += remaining * slabs[slabs.length - 1][1];
    return Math.max(0, Math.round(tax));
  };

  const oldTaxable = Math.max(0, (oldRegimeInputs.income || 0) - (oldRegimeInputs.deductions || 0));
  const newTaxable = Math.max(0, (newRegimeInputs.income || 0));

  const oldTax = computeSlabTax(oldTaxable, [ [250000, 0], [250000, 0.05], [500000, 0.2] ]); // rest at 30%
  const newTax = computeSlabTax(newTaxable, [ [300000, 0], [300000, 0.05], [300000, 0.1], [300000, 0.15], [300000, 0.2] ]); // rest at 30%

  const result = {
    old: { taxable: oldTaxable, rateLabel: "Slab-based", tax: oldTax },
    newer: { taxable: newTaxable, rateLabel: "Slab-based", tax: newTax },
  };
  result.recommendation = (result.old.tax <= result.newer.tax) ? "Old Regime is suitable" : "New Regime is suitable";
  result.reason = result.old.tax <= result.newer.tax
    ? "Your deductions reduce taxable income more under the Old Regime."
    : "Lower slab rates benefit you more under the New Regime.";
  return result;
}

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("qa"); // 'qa' | 'opt'
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState([]);
  const [useManual, setUseManual] = useState(false);
  const [manualIncome, setManualIncome] = useState(0);
  const [manualDeductions, setManualDeductions] = useState(0);
  const [userOptimization, setUserOptimization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!(token && user));
  }, []);

  // Fetch user's optimization data from backend when opening optimization tab
  useEffect(() => {
    if (open && mode === 'opt' && isAuthenticated && !useManual) {
      fetchUserOptimizationData();
    }
  }, [open, mode, isAuthenticated, useManual]);

  const fetchUserOptimizationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getTaxOptimization();
      setUserOptimization(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch optimization data:', err);
      setError('Failed to load your tax data. Please try again.');
      setLoading(false);
      // Fallback to localStorage if API fails
      setUserOptimization(null);
    }
  };

  // Use backend data or fallback to localStorage for backward compatibility
  const totals = useMemo(() => {
    if (userOptimization && !useManual) {
      return {
        income: userOptimization.totalIncome || 0,
        deductions: userOptimization.totalDeductions || 0
      };
    }
    
    // ONLY use localStorage if user is authenticated (to prevent showing other user's data)
    if (isAuthenticated) {
      const incomeEntries = JSON.parse(localStorage.getItem("incomeEntries") || "[]");
      const deductionEntries = JSON.parse(localStorage.getItem("deductionEntries") || "[]");
      const income = incomeEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const deductions = deductionEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      return { income, deductions };
    }
    
    // Return zero if not authenticated (don't show any data)
    return { income: 0, deductions: 0 };
  }, [userOptimization, useManual, open, isAuthenticated]);

  const inputs = useMemo(() => {
    const income = useManual ? Number(manualIncome) || 0 : totals.income;
    const deductions = useManual ? Number(manualDeductions) || 0 : totals.deductions;
    return { income, deductions };
  }, [useManual, manualIncome, manualDeductions, totals]);

  const comparison = useMemo(() => {
    // If we have backend optimization data and not in manual mode, use it
    if (userOptimization && !useManual) {
      return {
        old: {
          taxable: userOptimization.oldRegime.taxableIncome,
          rateLabel: "Slab-based",
          tax: userOptimization.oldRegime.tax
        },
        newer: {
          taxable: userOptimization.newRegime.taxableIncome,
          rateLabel: "Slab-based",
          tax: userOptimization.newRegime.tax
        },
        recommendation: userOptimization.recommendation + " is suitable",
        reason: userOptimization.recommendation === "Old Regime"
          ? "Your deductions reduce taxable income more under the Old Regime."
          : "Lower slab rates benefit you more under the New Regime."
      };
    }
    
    // Otherwise calculate locally
    return calculateTax({ income: inputs.income, deductions: inputs.deductions }, { income: inputs.income });
  }, [inputs, userOptimization, useManual]);

  const handleAsk = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    // Enhanced FAQ matching with better scoring algorithm
    const qLower = question.toLowerCase().trim();
    
    const calculateScore = (item) => {
      const questionText = item.q.toLowerCase();
      const answerText = item.a.toLowerCase();
      const keywords = (item.keywords || []).map(k => k.toLowerCase());
      
      let score = 0;
      
      // Split user question into words and important phrases
      const userWords = qLower.split(/\s+/).filter(w => w.length > 2);
      const qWords = questionText.split(/\s+/).filter(w => w.length > 2);
      
      // 1. Check for exact phrase match in FAQ question (highest priority)
      if (questionText.includes(qLower)) {
        score += 100;
      }
      
      // 2. Check for partial phrase matches (important multi-word concepts)
      const importantPhrases = [
        'tax liability', 'which regime', 'perfect regime', 'best regime',
        'amount to pay', 'how much tax', 'income and deduction',
        'old regime', 'new regime', 'taxable income', 'section 80c'
      ];
      
      importantPhrases.forEach(phrase => {
        if (qLower.includes(phrase)) {
          if (questionText.includes(phrase) || answerText.includes(phrase)) {
            score += 50;
          }
          keywords.forEach(kw => {
            if (kw.includes(phrase) || phrase.includes(kw)) {
              score += 30;
            }
          });
        }
      });
      
      // 3. Keyword matching (medium priority)
      keywords.forEach(keyword => {
        if (qLower.includes(keyword)) {
          score += 20;
        }
        // Partial keyword match
        userWords.forEach(uw => {
          if (keyword.includes(uw) || uw.includes(keyword)) {
            score += 10;
          }
        });
      });
      
      // 4. Individual word matching in FAQ question (lower priority)
      userWords.forEach(userWord => {
        qWords.forEach(qWord => {
          if (userWord === qWord) {
            score += 5;
          } else if (userWord.includes(qWord) || qWord.includes(userWord)) {
            score += 2;
          }
        });
      });
      
      // 5. Semantic intent matching
      const intentPatterns = [
        { pattern: /(what is|define|explain|meaning of).*(tax liability|amount.*pay|how much)/i, boost: 40, targetKeywords: ['tax liability', 'amount to pay', 'how much tax'] },
        { pattern: /(which|what|how.*check|find|choose|best|perfect|suitable).*(regime|old.*new)/i, boost: 40, targetKeywords: ['which regime', 'best regime', 'regime comparison'] },
        { pattern: /(compare|difference|vs).*(regime|old.*new)/i, boost: 35, targetKeywords: ['compare', 'old regime', 'new regime'] },
        { pattern: /(how|what).*(deduction|exemption|80c)/i, boost: 30, targetKeywords: ['deduction', '80c'] },
      ];
      
      intentPatterns.forEach(({ pattern, boost, targetKeywords }) => {
        if (pattern.test(qLower)) {
          targetKeywords.forEach(tk => {
            if (keywords.includes(tk) || questionText.includes(tk)) {
              score += boost;
            }
          });
        }
      });
      
      return score;
    };
    
    // Sort by score and get best match
    const sorted = [...faqData]
      .map(item => ({ item, score: calculateScore(item) }))
      .sort((a, b) => b.score - a.score);
    
    const best = sorted[0];
    
    // Require minimum score threshold to ensure relevance
    const found = best && best.score > 15 ? {
      text: best.item.a,
      sources: [best.item.source]
    } : {
      text: "Sorry, I couldn't find a precise answer in the FAQ. Here are some tips:\n\n" +
           "• For tax liability questions: Use the Optimization tab to see your exact tax amount\n" +
           "• For regime comparison: Use the Optimization tab to compare Old vs New Regime\n" +
           "• For deductions: Check the 'Add Deduction' page for eligible deductions\n\n" +
           "You can also contact 24/7 Expert Support or rephrase your question.",
      sources: []
    };
    
    setAnswers((prev) => [{ q: question, a: found }, ...prev]);
    setQuestion("");
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 1100,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#6c5ce7',
          color: '#fff',
          border: 'none',
          boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        aria-label={open ? "Close AI Assistant" : "Open AI Assistant"}
      >
        <span style={{ fontSize: 22 }}>🤖</span>
      </button>

      {open && (
        <div style={{ position: 'fixed', right: 24, bottom: 92, width: 380, maxWidth: '92vw', background: '#fff', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.2)', zIndex: 1100, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #eee' }}>
            <strong>AI Tax Assistant</strong>
            <div>
              <button className={mode === 'qa' ? 'btn-primary' : 'btn-outline'} onClick={() => setMode('qa')} style={{ marginRight: 8 }}>Q&A</button>
              <button className={mode === 'opt' ? 'btn-primary' : 'btn-outline'} onClick={() => setMode('opt')}>Optimization</button>
            </div>
          </div>

          {mode === 'qa' ? (
            <div style={{ padding: 12 }}>
              <form onSubmit={handleAsk} style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about deductions, filing, etc."
                  className="form-input"
                  style={{ flex: 1, minWidth: 0 }}
                />
                <button type="submit" className="btn-primary" style={{ width: 'auto', flexShrink: 0 }}>Ask</button>
              </form>
              <div style={{ maxHeight: 300, overflow: 'auto', display: 'grid', gap: 10 }}>
                {answers.length === 0 && <em>Ask a question to get started. Answers will include sources.</em>}
                {answers.map((item, i) => (
                  <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontWeight: 600 }}>Q: {item.q}</div>
                    <div style={{ marginTop: 6 }}>{item.a.text}</div>
                    <div style={{ marginTop: 6, fontSize: 12 }}>
                      Sources: {item.a.sources.map((s, si) => (
                        <a key={si} href={s.url} target="_blank" rel="noreferrer" style={{ marginRight: 8 }}>{s.title}</a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: 12 }}>
              {!isAuthenticated && (
                <div style={{ 
                  padding: '12px', 
                  background: '#fef3c7', 
                  borderRadius: '8px',
                  marginBottom: '12px',
                  fontSize: '14px',
                  color: '#92400e'
                }}>
                  ⚠️ Please <a href="/login" style={{ color: '#6c5ce7', fontWeight: 600 }}>login</a> to view your personalized tax optimization.
                </div>
              )}
              
              {error && (
                <div style={{ 
                  padding: '10px', 
                  background: '#fee', 
                  borderRadius: '6px',
                  marginBottom: '10px',
                  fontSize: '13px',
                  color: '#c00'
                }}>
                  {error}
                </div>
              )}
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  Loading your tax data...
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong>Inputs</strong>
                      {isAuthenticated && (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                          <input type="checkbox" checked={useManual} onChange={(e) => setUseManual(e.target.checked)} />
                          Enter values manually
                        </label>
                      )}
                    </div>
                    {useManual || !isAuthenticated ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10, marginTop: 8 }}>
                        <div>
                          <label className="form-label" htmlFor="ai-income">Income (₹)</label>
                          <input id="ai-income" type="number" className="form-input" value={manualIncome} onChange={(e) => setManualIncome(e.target.value)} min="0" placeholder="Enter income" />
                        </div>
                        <div>
                          <label className="form-label" htmlFor="ai-deductions">Deductions for Old Regime (₹)</label>
                          <input id="ai-deductions" type="number" className="form-input" value={manualDeductions} onChange={(e) => setManualDeductions(e.target.value)} min="0" placeholder="Enter deductions" />
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 6, fontSize: 14 }}>
                        {isAuthenticated && userOptimization ? (
                          <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '6px', color: '#166534' }}>
                            ✓ Using your saved data: Income: ₹{totals.income.toLocaleString()} • Deductions: ₹{totals.deductions.toLocaleString()}
                          </div>
                        ) : (
                          <div>
                            Income: ₹{totals.income.toLocaleString()} • Deductions (Old Regime): ₹{totals.deductions.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 6 }}></th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 6 }}>Old Regime</th>
                        <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 6 }}>New Regime</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: 6 }}>Taxable Income</td>
                        <td style={{ padding: 6 }}>₹{comparison.old.taxable.toLocaleString()}</td>
                        <td style={{ padding: 6 }}>₹{comparison.newer.taxable.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6 }}>Applicable Rate</td>
                        <td style={{ padding: 6 }}>{comparison.old.rateLabel}</td>
                        <td style={{ padding: 6 }}>{comparison.newer.rateLabel}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6 }}>Final Tax Liability</td>
                        <td style={{ padding: 6 }}>₹{comparison.old.tax.toLocaleString()}</td>
                        <td style={{ padding: 6 }}>₹{comparison.newer.tax.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ marginTop: 10, padding: '10px', background: '#eef2ff', borderRadius: '6px' }}>
                    <strong style={{ color: '#4f46e5' }}>Recommendation:</strong> {comparison.recommendation}
                    <div style={{ marginTop: 4, fontSize: 14, color: '#4338ca' }}>{comparison.reason}</div>
                  </div>
                  {isAuthenticated && userOptimization && (
                    <div style={{ marginTop: 10, fontSize: 13, color: '#059669', fontWeight: 500 }}>
                      💰 Potential Savings: ₹{userOptimization.savings.toLocaleString()}
                    </div>
                  )}
                  <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
                    {isAuthenticated 
                      ? "✅ This calculation is based on your saved income and deduction entries."
                      : "ℹ️ Enter values manually above or login to see calculations based on your saved data."}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AIAssistant;


