document.addEventListener('DOMContentLoaded', () => {
    const totalSteps = 7;
    let currentStep = 1;

    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const progressFill = document.getElementById('progress-fill');
    const stepIndicator = document.getElementById('step-indicator');
    const finalOutput = document.getElementById('finalOutput');
    const copyBtn = document.getElementById('copyBtn');

    function updateUI() {
        // Toggle step visibility
        document.querySelectorAll('.step').forEach(stepEl => {
            if (parseInt(stepEl.getAttribute('data-step')) === currentStep) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        });

        // Update progress bar
        if (currentStep <= totalSteps) {
            const percentage = ((currentStep) / totalSteps) * 100;
            progressFill.style.width = `${percentage}%`;
            stepIndicator.textContent = `STEP ${currentStep} OF ${totalSteps}`;
            document.querySelector('.progress-indicator').style.display = 'flex';
        } else {
            // Result step
            document.querySelector('.progress-indicator').style.display = 'none';
        }

        // Update buttons
        if (currentStep === 1) {
            backBtn.style.visibility = 'hidden';
            nextBtn.innerHTML = 'Next &rarr;';
        } else if (currentStep > 1 && currentStep < totalSteps) {
            backBtn.style.visibility = 'visible';
            nextBtn.innerHTML = 'Next &rarr;';
        } else if (currentStep === totalSteps) {
            backBtn.style.visibility = 'visible';
            nextBtn.innerHTML = 'Generate Profile &rarr;';
        } else if (currentStep > totalSteps) {
            backBtn.style.visibility = 'visible';
            nextBtn.style.display = 'none';
            generateProfile();
        }

        // Keep next btn visible if we drop back from results
        if (currentStep <= totalSteps) {
            nextBtn.style.display = 'inline-flex';
        }
        
        window.scrollTo(0, 0);
    }

    nextBtn.addEventListener('click', () => {
        if (currentStep <= totalSteps) {
            currentStep++;
            updateUI();
        }
    });

    backBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateUI();
        }
    });

    function getVal(id) {
        return document.getElementById(id).value.trim();
    }

    function generateProfile() {
        // Collect Data
        const identity = {
            fullName: getVal('fullName'),
            titleRole: getVal('titleRole'),
            companyName: getVal('companyName'),
            tagline: getVal('tagline')
        };

        const audience = {
            idealClient: getVal('idealClient'),
            painPoint: getVal('painPoint'),
            desiredOutcome: getVal('desiredOutcome')
        };

        const offers = {
            offer1: getVal('offer1'),
            offer2: getVal('offer2'),
            offer3: getVal('offer3')
        };

        const voice = {
            commStyle: getVal('commStyle'),
            signatureWords: getVal('signatureWords'),
            neverUseWords: getVal('neverUseWords')
        };

        const guardrails = {
            topicsAvoid: getVal('topicsAvoid'),
            formattingRules: getVal('formattingRules')
        };

        const credibility = {
            credFacts: getVal('credFacts'),
            frameworks: getVal('frameworks')
        };

        const instructions = {
            standardCta: getVal('standardCta'),
            globalInstructions: getVal('globalInstructions')
        };

        // Construct XML Output
        let output = `<voice_profile>\n`;

        output += `  <identity>\n`;
        if(identity.fullName) output += `    Name: ${identity.fullName}\n`;
        if(identity.titleRole) output += `    Role: ${identity.titleRole}\n`;
        if(identity.companyName) output += `    Company: ${identity.companyName}\n`;
        if(identity.tagline) output += `    Tagline: ${identity.tagline}\n`;
        output += `  </identity>\n\n`;

        output += `  <audience>\n`;
        if(audience.idealClient) output += `    Ideal Client: ${audience.idealClient}\n`;
        if(audience.painPoint) output += `    Primary Pain Point: ${audience.painPoint}\n`;
        if(audience.desiredOutcome) output += `    Desired Outcome: ${audience.desiredOutcome}\n`;
        output += `  </audience>\n\n`;

        output += `  <offers>\n`;
        if(offers.offer1) output += `    Main Offer: ${offers.offer1}\n`;
        if(offers.offer2) output += `    Secondary Offer: ${offers.offer2}\n`;
        if(offers.offer3) output += `    Other Offer: ${offers.offer3}\n`;
        output += `  </offers>\n\n`;

        output += `  <voice_and_tone>\n`;
        if(voice.commStyle) output += `    Style: ${voice.commStyle}\n`;
        if(voice.signatureWords) output += `    Frequently Used Words: ${voice.signatureWords}\n`;
        if(voice.neverUseWords) output += `    Banned Words: ${voice.neverUseWords}\n`;
        output += `  </voice_and_tone>\n\n`;

        output += `  <guardrails>\n`;
        if(guardrails.topicsAvoid) output += `    Topics to Avoid: ${guardrails.topicsAvoid}\n`;
        if(guardrails.formattingRules) output += `    Formatting Rules: ${guardrails.formattingRules}\n`;
        output += `  </guardrails>\n\n`;

        output += `  <credibility>\n`;
        if(credibility.credFacts) output += `    Facts/Numbers: ${credibility.credFacts}\n`;
        if(credibility.frameworks) output += `    Frameworks/Methods: ${credibility.frameworks}\n`;
        output += `  </credibility>\n\n`;

        output += `  <standing_instructions>\n`;
        if(instructions.standardCta) output += `    Standard CTA: ${instructions.standardCta}\n`;
        if(instructions.globalInstructions) output += `    Global Rules: ${instructions.globalInstructions}\n`;
        output += `  </standing_instructions>\n`;

        output += `</voice_profile>`;

        finalOutput.value = output;
    }

    copyBtn.addEventListener('click', () => {
        finalOutput.select();
        document.execCommand('copy');
        
        // Visual feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg> Copied!`;
        copyBtn.style.backgroundColor = '#2ea043';
        copyBtn.style.color = '#fff';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.backgroundColor = '';
            copyBtn.style.color = '';
        }, 2000);
    });

    // Handle enter key to go next
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey || e.key === 'Enter' && e.metaKey) {
            nextBtn.click();
        }
    });

    // Initialize UI
    updateUI();
});
