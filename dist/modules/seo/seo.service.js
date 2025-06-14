import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';
import mongoose, { Types } from 'mongoose';
import { SeoModel } from '../../models/seo.model.js';
import logger from '../../config/logger.js';
import PDFDocument from 'pdfkit';
import { Pagination } from '../../utils/pagination.js';
import { AuditModel } from '../../models/audit.model.js';
const executablePath = puppeteer.executablePath();
console.log('Chromium executable path:', executablePath);
class SeoService {
    constructor() {
        this.seoModel = SeoModel;
        this.auditModel = AuditModel;
    }
    static getInstance() {
        if (!SeoService.instance) {
            SeoService.instance = new SeoService();
        }
        return SeoService.instance;
    }
    async findProjects(id, type, page) {
        try {
            let pagination;
            if (type === 'dash') {
                pagination = new Pagination(5, page ? +page : 1);
            }
            if (type === 'all') {
                pagination = new Pagination(15, page ? +page : 1);
            }
            // console.log(pagination?.skip + 'skip', pagination?.limit + 'limit');
            // inside your async method
            const baseQuery = this.seoModel
                .find({ ownerId: id })
                .sort({ createdAt: -1 });
            const paginatedQuery = pagination
                ? baseQuery.skip(pagination.skip).limit(pagination.limit)
                : baseQuery;
            const project = await paginatedQuery.exec();
            const info = pagination.getPaginationInfo(project.length);
            const pageItems = pagination
                ? project.slice(0, pagination.perPage)
                : project;
            return {
                data: project ? pageItems : [],
                info: project ? info : '',
            };
        }
        catch (error) {
            logger.error(`Error checking project existence: ${error}`);
            throw new Error('Failed to check project existence');
        }
    }
    async getProjectOverview(id) {
        try {
            // Aggregation pipeline
            const ownerId = new Types.ObjectId(id);
            const [overview] = await this.seoModel
                .aggregate([
                { $match: { ownerId } }, // restrict to this user’s docs
                {
                    $group: {
                        _id: null,
                        totalProjects: { $sum: 1 }, // count all docs
                        activeProjects: { $sum: { $cond: ['$active', 1, 0] } }, // count where active===true
                        totalIssues: { $sum: '$criticalCount' }, // sum all criticalCount fields
                        averageScore: { $avg: '$score' }, // avg of score fields
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalProjects: 1,
                        activeProjects: 1,
                        totalIssues: 1,
                        // convert averageScore (0–1 scale?) to percent if needed:
                        // averageScore: { $multiply: ['$averageScore', 100] }
                        averageScore: 1,
                    },
                },
            ])
                .exec();
            const result = overview ?? {
                totalProjects: 0,
                activeProjects: 0,
                totalIssues: 0,
                averageScore: 0,
            };
            return { data: result };
        }
        catch (error) {
            logger.error(`Error checking project existence: ${error}`);
            throw new Error('Failed to check project existence');
        }
    }
    async createNewSeoProject(data) {
        try {
            const seoEntry = await this.seoModel.create(data);
            return { data: seoEntry };
        }
        catch (error) {
            logger.error(`Error creating new SEO entry: ${error}`);
            return { error: 'Failed to create SEO entry' };
        }
    }
    async updateSeoEntry(id, data) {
        try {
            const project = await this.seoModel.findByIdAndUpdate(id, {
                $set: data,
            }, { new: true } // Return the updated document
            );
            return { data: project ? [project] : [] };
        }
        catch (error) {
            logger.error(`Error checking project existence: ${error}`);
            return { error: 'Failed to update Project entry' };
        }
    }
    async findAllAudits(id, page) {
        try {
            let pagination;
            pagination = new Pagination(10, page ? +page : 1);
            // inside your async method
            const baseQuery = this.auditModel
                .find({ ownerId: id })
                .populate('projectId')
                .sort({ createdAt: -1 });
            const paginatedQuery = pagination
                ? baseQuery.skip(pagination.skip).limit(pagination.limit)
                : baseQuery;
            const project = await paginatedQuery.exec();
            const info = pagination.getPaginationInfo(project.length);
            const pageItems = pagination
                ? project.slice(0, pagination.perPage)
                : project;
            return {
                data: project ? pageItems : [],
                info: project ? info : '',
            };
        }
        catch (error) {
            logger.error(`Error finding audit history: ${error}`);
            return { error: 'Failed to create audit entry' };
        }
    }
    async findAllAuditsForProject(ownerId, projectId, page) {
        try {
            let pagination;
            pagination = new Pagination(10, page ? +page : 1);
            // inside your async method
            const baseQuery = this.auditModel
                .find({
                ownerId: ownerId,
                projectId: projectId,
            })
                .sort({ createdAt: -1 });
            const paginatedQuery = pagination
                ? baseQuery.skip(pagination.skip).limit(pagination.limit)
                : baseQuery;
            const project = await paginatedQuery.exec();
            const info = pagination.getPaginationInfo(project.length);
            const pageItems = pagination
                ? project.slice(0, pagination.perPage)
                : project;
            return {
                data: project ? pageItems : [],
                info: project ? info : '',
            };
        }
        catch (error) {
            logger.error(`Error finding audit history: ${error}`);
            return { error: 'Failed to create audit entry' };
        }
    }
    async createNewAudit(data) {
        try {
            const auditEntry = await this.auditModel.create(data);
            return { data: auditEntry };
        }
        catch (error) {
            logger.error(`Error creating new audit entry: ${error}`);
            return { error: 'Failed to create audit entry' };
        }
    }
    async getAuditOverview(ownerId) {
        try {
            const id = new Types.ObjectId(ownerId);
            const [overview] = await this.auditModel
                .aggregate([
                { $match: { ownerId: id } },
                {
                    $group: {
                        _id: null,
                        totalAudits: { $sum: 1 },
                        completedAudits: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                        },
                        avgDuration: { $avg: { $toDouble: '$duration' } },
                        totalIssues: { $sum: '$criticalCount' },
                        avgImprovement: { $avg: '$score' },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalAudits: 1,
                        completedAudits: 1,
                        avgDuration: 1,
                        totalIssues: 1,
                        avgImprovement: 1,
                    },
                },
            ])
                .exec();
            // Default zeros if no data
            return (overview ?? {
                totalAudits: 0,
                completedAudits: 0,
                avgDuration: 0,
                totalIssues: 0,
                avgImprovement: 0,
            });
        }
        catch (err) {
            logger.error(`Error computing audit overview: ${err}`);
            throw new Error('Failed to get audit overview');
        }
    }
    async findProjectById(id) {
        try {
            const project = await this.seoModel.findById(id);
            return { data: project ? [project] : [] };
        }
        catch (error) {
            logger.error(`Error checking project existence: ${error}`);
            throw new Error('Failed to check project existence');
        }
    }
    async compareLastTwoAudits(ownerId, projectId) {
        try {
            const docs = await this.auditModel
                .aggregate([
                {
                    $match: {
                        ownerId: new Types.ObjectId(ownerId),
                        projectId: new Types.ObjectId(projectId),
                    },
                },
                { $sort: { createdAt: -1, id: 1 } },
                { $limit: 2 },
                { $project: { categories: 1, createdAt: 1 } },
            ])
                .exec();
            if (docs.length === 0) {
                // No audits at all
                return [];
            }
            const [latest, previous] = docs;
            const latestCats = latest.categories;
            const prevCats = previous?.categories;
            // Create a typed array of keys:
            const categoryKeys = Object.keys(latestCats);
            return categoryKeys.map((key) => {
                const currScoreRaw = latestCats[key];
                const currPct = currScoreRaw * 100;
                const current = `${Math.round(currPct)}/100`;
                if (!prevCats) {
                    return { category: key, current, change: `+0%` };
                }
                // Now TypeScript knows `key` is one of the four allowed strings
                const prevScoreRaw = prevCats[key] ?? 0;
                const prevPct = prevScoreRaw * 100;
                const diff = currPct - prevPct;
                const sign = diff >= 0 ? '+' : '';
                return {
                    category: key,
                    current,
                    previous: `${Math.round(prevPct)}/100`,
                    change: `${sign}${diff.toFixed(1)}%`,
                    direction: diff >= 0 ? 'Higher than last audit' : 'Lower than last audit',
                };
            });
        }
        catch (error) {
            logger.error(`Error checking audit comparisons : ${error}`);
            return { error: 'Failed to check audit comparisons' };
        }
    }
    async getSeoEntries(ownerId) {
        try {
            const seoEntries = await this.seoModel.find({ ownerId });
            return { data: seoEntries };
        }
        catch (error) {
            logger.error(`Error fetching SEO entries: ${error}`);
            return { error: 'Failed to fetch SEO entries' };
        }
    }
    async checkIfProjectExists(ownerId, url) {
        try {
            const project = await this.seoModel.findOne({ ownerId, url });
            return { data: project ? [project] : [] };
        }
        catch (error) {
            logger.error(`Error checking project existence: ${error}`);
            return { error: 'Failed to check project existence' };
        }
    }
    async lightHouseGenerateAudit(url) {
        const start = Date.now();
        let chromeInstance = null;
        let browser = null;
        try {
            let options = {};
            if (process.env.NODE_ENV === 'development') {
                chromeInstance = await launch({
                    chromeFlags: [
                        '--headless',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--single-process',
                        '--no-zygote',
                    ],
                });
                options = {
                    logLevel: 'verbose',
                    port: chromeInstance.port,
                    output: 'json',
                };
            }
            else {
                // chromeInstance = await launch({
                //   chromePath:
                //     process.env.CHROME_PATH || '/opt/render/.cache/puppeteer/chrome',
                //   chromeFlags: [
                //     '--headless',
                //     '--no-sandbox',
                //     '--disable-setuid-sandbox',
                //     '--disable-dev-shm-usage',
                //     '--disable-extensions',
                //     '--disable-gpu',
                //     '--remote-debugging-port=9222',
                //     '--disable-background-timer-throttling',
                //     '--disable-renderer-backgrounding',
                //     '--disable-backgrounding-occluded-windows',
                //   ],
                // });
                // options = {
                //   logLevel: 'verbose' as const,
                //   port: chromeInstance.port,
                //   output: 'json' as const,
                // };
                // Launch Puppeteer with specified executable path
                browser = await puppeteer.launch({
                    // executablePath: puppeteer.executablePath(),
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-extensions',
                        '--disable-gpu',
                    ],
                });
                const wsEndpoint = browser.wsEndpoint();
                const urlObj = new URL(wsEndpoint);
                const port = parseInt(urlObj.port, 10);
                options = {
                    logLevel: 'info',
                    output: 'json',
                    port,
                };
            }
            // 2) Run Lighthouse audit
            const runnerResult = await lighthouse(url, options);
            // 3) Kill Chrome
            // Clean up browser instances
            if (chromeInstance) {
                await chromeInstance.kill();
            }
            if (browser) {
                await browser.close();
            }
            // 4) Extract relevant categories
            if (!runnerResult || !runnerResult.lhr) {
                throw new Error('Lighthouse audit failed');
            }
            const { categories, audits, fetchTime, requestedUrl } = runnerResult.lhr;
            const durationMs = Date.now() - start;
            function firstSentence(text) {
                const match = text.match(/^[^.]*\./);
                return match ? match[0] : text;
            }
            // Build your audits payload
            const processedAudits = {
                'is-on-https': {
                    score: audits['is-on-https'].score ?? 0,
                    description: firstSentence(audits['is-on-https'].description ?? ''),
                },
                'redirects-http': {
                    score: audits['redirects-http'].score ?? 0,
                    description: firstSentence(audits['redirects-http'].description ?? ''),
                },
                viewport: {
                    score: audits.viewport.score ?? 0,
                    description: firstSentence(audits.viewport.description ?? ''),
                },
                'first-contentful-paint': {
                    score: audits['first-contentful-paint'].score ?? 0,
                    displayValue: audits['first-contentful-paint'].displayValue ?? '',
                    description: firstSentence(audits['first-contentful-paint'].description ?? ''),
                },
                'first-meaningful-paint': {
                    score: audits['first-meaningful-paint'].score ?? 0,
                    description: firstSentence(audits['first-meaningful-paint'].description ?? ''),
                },
                speedIndex: {
                    score: audits['speed-index'].score ?? 0,
                    displayValue: audits['speed-index'].displayValue ?? '',
                    description: firstSentence(audits['speed-index'].description ?? ''),
                },
                'errors-in-console': {
                    score: audits['errors-in-console'].score ?? 0,
                    description: firstSentence(audits['errors-in-console'].description ?? ''),
                },
                interactive: {
                    score: audits.interactive.score ?? 0,
                    displayValue: audits.interactive.displayValue ?? '',
                    description: firstSentence(audits.interactive.description ?? ''),
                },
                'bootup-time': {
                    score: audits['bootup-time'].score ?? 0,
                    displayValue: audits['bootup-time'].displayValue ?? '',
                    description: firstSentence(audits['bootup-time'].description ?? ''),
                },
            };
            //gets audit score
            function getAverageAuditScore(processedAudits) {
                const scores = Object.values(processedAudits).map((item) => item.score ?? 0);
                const count = scores.length;
                if (count === 0)
                    return 0;
                const total = scores.reduce((sum, s) => sum + s, 0);
                const average = total / count;
                // Round to two decimal places and convert back to Number
                return Number(average.toFixed(2));
            }
            const score = getAverageAuditScore(processedAudits);
            // Count critical issues (score < 0.5 or score == 0)
            const criticalCount = Object.values(audits).reduce((count, a) => {
                return count + (a.score === null || a.score < 0.5 ? 1 : 0);
            }, 0);
            return {
                categories: {
                    performance: categories.performance.score ?? 0,
                    accessibility: categories.accessibility.score ?? 0,
                    seo: categories.seo.score ?? 0,
                    bestPractices: categories['best-practices'].score ?? 0,
                },
                audits: processedAudits,
                criticalCount,
                score,
                durationMs,
            };
        }
        catch (error) {
            logger.error(`Error generating Lighthouse report: ${error.message}`, error.stack);
            return { error: 'Failed to generate Lighthouse report' };
        }
        finally {
            if (chromeInstance) {
                await chromeInstance.kill();
            }
            if (browser) {
                await browser.close();
            }
        }
    }
    async lightHouseGeneratePDFReport(url) {
        try {
            // 1) Launch headless Chrome
            const chrome = await launch({ chromeFlags: ['--headless'] });
            const options = {
                logLevel: 'info',
                port: chrome.port,
                output: 'json',
            };
            // 2) Run Lighthouse audit
            const runnerResult = await lighthouse(url, options);
            // 3) Kill Chrome
            await chrome.kill();
            // 4) Extract relevant categories
            if (!runnerResult || !runnerResult.lhr) {
                throw new Error('Lighthouse audit failed');
            }
            const { categories, audits, fetchTime, requestedUrl } = runnerResult.lhr;
            return {
                categories,
                audits,
            };
        }
        catch (error) {
            logger.error(`Error generating Lighthouse report: ${error}`);
            return { error: 'Failed to generate Lighthouse report' };
        }
    }
    async createPdfReport(report, res) {
        const { audits, categories, url } = report;
        try {
            // Classify audits dynamically
            const critical = {};
            const good = {};
            for (const [id, audit] of Object.entries(audits)) {
                const s = audit.score;
                if (s === null || s === 0 || (typeof s === 'number' && s < 0.5)) {
                    critical[id] = audit;
                }
                else {
                    good[id] = audit;
                }
            }
            // Stream PDF response
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="report.pdf"');
            const doc = new PDFDocument({ margin: 40 });
            doc.pipe(res);
            // Title page
            doc
                .fontSize(22)
                .text('Lighthouse Report', { align: 'center' })
                .moveDown()
                .fontSize(12)
                .text(`URL: ${report.fetchedUrl ?? report.url ?? 'N/A'}`, {
                align: 'center',
            })
                .text(`Date: ${new Date().toLocaleString()}`, { align: 'center' });
            // Dynamic sections
            this.writeCategorySection(doc, categories);
            this.writeAuditSection(doc, critical, 'Critical Issues');
            this.writeAuditSection(doc, good, 'No Issues');
            doc.end();
        }
        catch (error) {
            logger.error(`Error generating Lighthouse PDF report: ${error}`);
            return { error: 'Failed to generate Lighthouse PDF report' };
        }
    }
    async isValidObjectId(id) {
        console.log(mongoose.Types.ObjectId.isValid(id));
        return mongoose.Types.ObjectId.isValid(id);
    }
    async writeCategorySection(doc, categories) {
        doc
            .addPage()
            .fontSize(18)
            .text('Categories', { underline: true })
            .moveDown(0.5);
        for (const [id, cat] of Object.entries(categories)) {
            const scorePct = typeof cat.score === 'number'
                ? `${Math.round(cat.score * 100)}%`
                : 'N/A';
            // You can still pull out well-known props if they exist:
            const title = cat.title ?? id;
            const description = cat.description ?? '';
            doc.fontSize(14).text(title).moveDown(0.1);
            doc.fontSize(12).text(`Score: ${scorePct}`, { indent: 20 });
            doc
                .fontSize(12)
                .text(`Description: ${description}`, { indent: 20 })
                .moveDown(0.5);
        }
    }
    async writeAuditSection(doc, audits, sectionTitle) {
        doc
            .addPage()
            .fontSize(18)
            .text(sectionTitle, { underline: true })
            .moveDown(0.5);
        for (const [id, audit] of Object.entries(audits)) {
            const { title = id, score, description = '', displayValue } = audit;
            const scoreText = score == null ? 'N/A' : `${Math.round(score * 100)}%`;
            doc.fontSize(14).text(title).moveDown(0.1);
            doc.fontSize(12).text(`Score: ${scoreText}`, { indent: 20 });
            if (displayValue) {
                doc.text(`Value: ${displayValue}`, { indent: 20 });
            }
            // Optionally only first sentence
            const firstSentence = description ?? description;
            doc.text(`Description: ${firstSentence}`, { indent: 20 }).moveDown(0.5);
        }
    }
}
export default SeoService;
