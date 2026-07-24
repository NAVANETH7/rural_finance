"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScheme = exports.getRecommendedSchemes = void 0;
const models_1 = require("../models");
const getRecommendedSchemes = async (req, res) => {
    try {
        const { businessId } = req.query;
        let business = null;
        if (businessId) {
            business = await models_1.Business.findById(businessId);
        }
        let schemes = await models_1.Scheme.find({ isActive: true });
        // Seed default schemes if DB is empty
        if (schemes.length === 0) {
            const defaultSchemes = [
                {
                    name: 'Pradhan Mantri MUDRA Yojana (Tarun Scheme)',
                    code: 'MUDRA_TARUN',
                    category: 'Micro-loan',
                    description: 'Collateral-free business expansion loan up to Rs. 10 Lakhs for established rural micro-enterprises.',
                    maxBenefitAmount: 1000000,
                    subsidizedInterestRate: 8.0,
                    applicationLink: 'https://www.mudra.org.in/',
                    regionApplicability: ['All'],
                    eligibilityCriteria: {
                        minMonthlyIncome: 30000,
                        maxMonthlyIncome: 1000000,
                        minBusinessAgeMonths: 12,
                        allowedCategories: ['Retail', 'Agriculture', 'Manufacturing', 'Services'],
                        shgRequired: false
                    }
                },
                {
                    name: 'Kisan Credit Card (KCC) Subsidized Interest Gateway',
                    code: 'KCC_SUBSIDY',
                    category: 'Subsidy',
                    description: 'Slashes micro-farm loan interest rates down to 4.0% with government interest subvention reimbursements.',
                    maxBenefitAmount: 300000,
                    subsidizedInterestRate: 4.0,
                    applicationLink: 'https://pmkisan.gov.in/',
                    regionApplicability: ['All'],
                    eligibilityCriteria: {
                        minMonthlyIncome: 10000,
                        maxMonthlyIncome: 500000,
                        minBusinessAgeMonths: 6,
                        allowedCategories: ['Agriculture', 'Dairy', 'Fisheries', 'Agro-processing'],
                        shgRequired: false
                    }
                },
                {
                    name: 'PMEGP Subsidy Scheme for Women & Rural SHGs',
                    code: 'PMEGP_SHG',
                    category: 'Subsidy',
                    description: 'Up to 35% margin money subsidy for rural women-led enterprise setups and Self Help Groups.',
                    maxBenefitAmount: 500000,
                    subsidizedInterestRate: 5.5,
                    applicationLink: 'https://www.kviconline.gov.in/pmegpeportal/',
                    regionApplicability: ['All'],
                    eligibilityCriteria: {
                        minMonthlyIncome: 5000,
                        maxMonthlyIncome: 300000,
                        minBusinessAgeMonths: 0,
                        allowedCategories: ['Manufacturing', 'Handicraft', 'Services', 'Retail'],
                        shgRequired: true
                    }
                }
            ];
            for (const d of defaultSchemes) {
                await models_1.Scheme.create(d);
            }
            schemes = await models_1.Scheme.find({ isActive: true });
        }
        if (!business) {
            return res.status(200).json({
                success: true,
                count: schemes.length,
                data: schemes.map(s => ({
                    scheme: s,
                    matchScore: 90,
                    matchReason: 'General eligibility match based on active platform status.'
                }))
            });
        }
        // Match logic
        const matchedResults = schemes.map((scheme) => {
            let score = 70;
            const reasons = [];
            const criteria = scheme.eligibilityCriteria || { minMonthlyIncome: 0, minBusinessAgeMonths: 0, allowedCategories: [] };
            if (business.monthlyIncome >= (criteria.minMonthlyIncome ?? 0)) {
                score += 10;
                reasons.push(`Monthly revenue (Rs. ${business.monthlyIncome}) meets threshold.`);
            }
            if (business.businessAge >= (criteria.minBusinessAgeMonths ?? 0)) {
                score += 10;
                reasons.push(`Operating age (${business.businessAge} months) satisfies vintage rule.`);
            }
            if (criteria.allowedCategories && criteria.allowedCategories.includes(business.category)) {
                score += 10;
                reasons.push(`Business sector (${business.category}) is prioritized under scheme guidelines.`);
            }
            return {
                scheme,
                matchScore: Math.min(score, 98),
                matchReason: reasons.join(' ') || 'Qualifies based on business operating metrics.'
            };
        }).sort((a, b) => b.matchScore - a.matchScore);
        res.status(200).json({
            success: true,
            count: matchedResults.length,
            data: matchedResults
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch schemes: ' + error.message });
    }
};
exports.getRecommendedSchemes = getRecommendedSchemes;
const createScheme = async (req, res) => {
    try {
        const scheme = await models_1.Scheme.create(req.body);
        res.status(201).json({ success: true, data: scheme });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create scheme: ' + error.message });
    }
};
exports.createScheme = createScheme;
