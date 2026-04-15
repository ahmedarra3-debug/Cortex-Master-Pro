function parseUiSelections(rawUiSelections) {
    if (!rawUiSelections) return {};
    try {
        return JSON.parse(rawUiSelections);
    } catch (error) {
        console.warn("⚠️ [SPECS]: uiSelections is invalid JSON. Falling back to empty object.");
        return {};
    }
}

function getScienceBundle(safeMode, imageScience, videoScience) {
    if (safeMode === 'VIDEO') {
        return {
            science: videoScience,
            domains: videoScience.visual_domains || {},
            qualitySpecs: videoScience.global_quality?.specs || "High-Quality Video Render",
            modelProfiles: videoScience.model_profiles || []
        };
    }

    return {
        science: imageScience,
        domains: imageScience.domains || {},
        qualitySpecs: imageScience.global_quality?.specs || "High-Quality Photo Render",
        modelProfiles: imageScience.model_profiles || []
    };
}

function resolveDomainSpecs(domains, requestedDomain) {
    return domains[requestedDomain] || domains.General || Object.values(domains)[0] || {
        label: "General Creative",
        science: "Standard Physics"
    };
}

function buildProductionSpecs(data, imageScience, videoScience) {
    const uiSelections = parseUiSelections(data.uiSelections);
    const isUpdate = (data.isUpdate === "true");
    const mode = data.mode;
    const safeMode = (mode || 'photo').toUpperCase();
    const selectedDomain = data.domain;
    const currentInput = isUpdate ? data.userUpdate : data.concept;

    const { science, domains, qualitySpecs, modelProfiles } = getScienceBundle(
        safeMode,
        imageScience,
        videoScience
    );
    const domainSpecs = resolveDomainSpecs(domains, selectedDomain);

    return {
        uiSelections,
        isUpdate,
        mode,
        safeMode,
        selectedDomain,
        currentInput,
        science,
        domains,
        domainSpecs,
        qualitySpecs,
        modelProfiles
    };
}

module.exports = { buildProductionSpecs };
