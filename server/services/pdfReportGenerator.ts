import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

export class PdfReportGenerator {
  async generateScoutingReport(playerData: any, stats: any, scoutingReport: any): Promise<Buffer> {
    try {
      console.log(`Generating PDF report for ${playerData.name}`);
      
      const htmlContent = this.generateReportHTML(playerData, stats, scoutingReport);
      
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });
      
      await browser.close();
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw error;
    }
  }

  private generateReportHTML(playerData: any, stats: any, scoutingReport: any): string {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Scouting - ${playerData.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .header {
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: white;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: bold;
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .player-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
            padding: 0 20px;
        }
        
        .info-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 25px;
        }
        
        .info-card h3 {
            color: #1e40af;
            font-size: 1.3em;
            margin-bottom: 20px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .info-label {
            font-weight: 600;
            color: #475569;
        }
        
        .info-value {
            font-weight: 500;
            color: #1e293b;
        }
        
        .stats-section {
            margin: 40px 20px;
        }
        
        .section-title {
            font-size: 1.8em;
            color: #1e40af;
            margin-bottom: 25px;
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 15px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: #ffffff;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .stat-value {
            font-size: 2.2em;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
        }
        
        .stat-label {
            font-size: 0.9em;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        
        .percentiles-section {
            margin: 40px 20px;
        }
        
        .percentile-bar {
            margin-bottom: 20px;
        }
        
        .percentile-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .bar-container {
            width: 100%;
            height: 20px;
            background: #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
        }
        
        .bar-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 0.5s ease;
        }
        
        .excellent { background: linear-gradient(90deg, #22c55e, #16a34a); }
        .good { background: linear-gradient(90deg, #3b82f6, #2563eb); }
        .average { background: linear-gradient(90deg, #eab308, #d97706); }
        .below { background: linear-gradient(90deg, #f97316, #ea580c); }
        .poor { background: linear-gradient(90deg, #ef4444, #dc2626); }
        
        .analysis-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 40px 20px;
        }
        
        .strengths, .weaknesses {
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            border: 1px solid #e2e8f0;
        }
        
        .strengths {
            border-left: 5px solid #22c55e;
        }
        
        .weaknesses {
            border-left: 5px solid #ef4444;
        }
        
        .strengths h4 {
            color: #166534;
            margin-bottom: 20px;
            font-size: 1.3em;
        }
        
        .weaknesses h4 {
            color: #991b1b;
            margin-bottom: 20px;
            font-size: 1.3em;
        }
        
        .strengths ul, .weaknesses ul {
            list-style: none;
        }
        
        .strengths li, .weaknesses li {
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
            font-weight: 500;
        }
        
        .strengths li:before {
            content: "✓ ";
            color: #22c55e;
            font-weight: bold;
            margin-right: 10px;
        }
        
        .weaknesses li:before {
            content: "⚠ ";
            color: #ef4444;
            font-weight: bold;
            margin-right: 10px;
        }
        
        .detailed-stats {
            margin: 40px 20px;
        }
        
        .stats-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .stats-table th {
            background: #1e40af;
            color: white;
            padding: 15px;
            font-weight: 600;
            text-align: left;
        }
        
        .stats-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .stats-table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .overall-rating {
            text-align: center;
            margin: 40px 20px;
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: white;
            padding: 30px;
            border-radius: 15px;
        }
        
        .rating-circle {
            display: inline-block;
            width: 120px;
            height: 120px;
            border: 8px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5em;
            font-weight: bold;
            margin: 20px auto;
            position: relative;
        }
        
        .footer {
            margin-top: 60px;
            padding: 30px;
            background: #f1f5f9;
            text-align: center;
            color: #64748b;
            border-top: 3px solid #3b82f6;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${playerData.name}</h1>
        <div class="subtitle">Rapport de Scouting Détaillé</div>
        <div style="margin-top: 15px; font-size: 1em;">Généré le ${currentDate}</div>
    </div>

    <div class="player-info">
        <div class="info-card">
            <h3>Informations Personnelles</h3>
            <div class="info-row">
                <span class="info-label">Nom complet:</span>
                <span class="info-value">${playerData.fullName || playerData.name}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Âge:</span>
                <span class="info-value">${playerData.age || 'N/A'} ans</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date de naissance:</span>
                <span class="info-value">${playerData.dateOfBirth || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Nationalité:</span>
                <span class="info-value">${playerData.nationality || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Taille:</span>
                <span class="info-value">${playerData.height ? playerData.height + 'm' : 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Pied fort:</span>
                <span class="info-value">${playerData.foot || 'N/A'}</span>
            </div>
        </div>

        <div class="info-card">
            <h3>Informations Club</h3>
            <div class="info-row">
                <span class="info-label">Club actuel:</span>
                <span class="info-value">${playerData.team || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Poste:</span>
                <span class="info-value">${playerData.position || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Ligue:</span>
                <span class="info-value">${playerData.league || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Valeur marchande:</span>
                <span class="info-value">${this.formatMarketValue(playerData.marketValue)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Fin de contrat:</span>
                <span class="info-value">${playerData.contractEnd || 'N/A'}</span>
            </div>
        </div>
    </div>

    ${this.generateStatsSection(stats)}
    
    ${this.generatePercentilesSection(scoutingReport)}
    
    ${this.generateAnalysisSection(scoutingReport)}
    
    ${this.generateDetailedStatsTable(stats)}
    
    ${this.generateOverallRating(scoutingReport)}

    <div class="footer">
        <p><strong>PlayerStats - Rapport de Scouting Professionnel</strong></p>
        <p>Ce rapport a été généré automatiquement en utilisant des données de sources fiables.</p>
        <p>Pour plus d'informations, visitez notre plateforme d'analyse football.</p>
    </div>
</body>
</html>`;
  }

  private generateStatsSection(stats: any[]): string {
    if (!stats || stats.length === 0) {
      return '<div class="stats-section"><h2 class="section-title">Aucune statistique disponible</h2></div>';
    }

    const latestStats = stats[0];
    
    return `
    <div class="stats-section">
        <h2 class="section-title">Statistiques Principales (Saison ${latestStats.season || '2024-25'})</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${latestStats.goals || 0}</div>
                <div class="stat-label">Buts</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${latestStats.assists || 0}</div>
                <div class="stat-label">Passes Décisives</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${latestStats.appearances || 0}</div>
                <div class="stat-label">Apparitions</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${latestStats.rating || 'N/A'}</div>
                <div class="stat-label">Note Moyenne</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round((latestStats.minutes || 0) / 90)}</div>
                <div class="stat-label">Matchs Complets</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${latestStats.passCompletionRate || 'N/A'}%</div>
                <div class="stat-label">Précision Passes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${latestStats.yellowCards || 0}</div>
                <div class="stat-label">Cartons Jaunes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${latestStats.redCards || 0}</div>
                <div class="stat-label">Cartons Rouges</div>
            </div>
        </div>
    </div>`;
  }

  private generatePercentilesSection(scoutingReport: any): string {
    if (!scoutingReport || !scoutingReport.percentiles) {
      return '';
    }

    const percentiles = scoutingReport.percentiles;
    const percentileItems = Object.entries(percentiles).map(([key, value]) => {
      const percentage = Number(value) || 0;
      const label = key.replace(/_/g, ' ').toUpperCase();
      const colorClass = this.getPercentileColorClass(percentage);
      
      return `
        <div class="percentile-bar">
            <div class="percentile-label">
                <span>${label}</span>
                <span>${percentage}%</span>
            </div>
            <div class="bar-container">
                <div class="bar-fill ${colorClass}" style="width: ${percentage}%"></div>
            </div>
        </div>`;
    }).join('');

    return `
    <div class="percentiles-section">
        <h2 class="section-title">Percentiles par Rapport à la Position</h2>
        ${percentileItems}
    </div>`;
  }

  private generateAnalysisSection(scoutingReport: any): string {
    if (!scoutingReport) {
      return '';
    }

    const strengths = scoutingReport.strengths || [];
    const weaknesses = scoutingReport.weaknesses || [];

    return `
    <div class="analysis-section">
        <div class="strengths">
            <h4>Points Forts</h4>
            <ul>
                ${strengths.map(strength => `<li>${strength}</li>`).join('')}
                ${strengths.length === 0 ? '<li>Aucun point fort identifié</li>' : ''}
            </ul>
        </div>
        <div class="weaknesses">
            <h4>Points à Améliorer</h4>
            <ul>
                ${weaknesses.map(weakness => `<li>${weakness}</li>`).join('')}
                ${weaknesses.length === 0 ? '<li>Aucun point faible majeur identifié</li>' : ''}
            </ul>
        </div>
    </div>`;
  }

  private generateDetailedStatsTable(stats: any[]): string {
    if (!stats || stats.length === 0) {
      return '';
    }

    const tableRows = stats.map(stat => `
        <tr>
            <td>${stat.season || 'N/A'}</td>
            <td>${stat.competition || 'N/A'}</td>
            <td>${stat.appearances || 0}</td>
            <td>${stat.goals || 0}</td>
            <td>${stat.assists || 0}</td>
            <td>${Math.round((stat.minutes || 0) / 90)}</td>
            <td>${stat.rating || 'N/A'}</td>
        </tr>
    `).join('');

    return `
    <div class="detailed-stats page-break">
        <h2 class="section-title">Historique Détaillé des Performances</h2>
        <table class="stats-table">
            <thead>
                <tr>
                    <th>Saison</th>
                    <th>Compétition</th>
                    <th>Matchs</th>
                    <th>Buts</th>
                    <th>Passes D.</th>
                    <th>Matchs Complets</th>
                    <th>Note</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    </div>`;
  }

  private generateOverallRating(scoutingReport: any): string {
    const rating = scoutingReport?.overallRating || 50;
    const ratingText = this.getRatingText(rating);

    return `
    <div class="overall-rating">
        <h2>Évaluation Globale</h2>
        <div class="rating-circle">
            ${rating}/100
        </div>
        <h3>${ratingText}</h3>
        <p>Cette évaluation est basée sur l'analyse comparative des performances du joueur par rapport à sa position dans la ligue.</p>
    </div>`;
  }

  private getPercentileColorClass(percentage: number): string {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    if (percentage >= 20) return 'below';
    return 'poor';
  }

  private getRatingText(rating: number): string {
    if (rating >= 85) return 'Joueur Exceptionnel';
    if (rating >= 75) return 'Très Bon Joueur';
    if (rating >= 65) return 'Bon Joueur';
    if (rating >= 50) return 'Joueur Moyen';
    return 'Joueur en Développement';
  }

  private formatMarketValue(value: number | null): string {
    if (!value) return 'N/A';
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K€`;
    }
    return `${value}€`;
  }
}

export const pdfReportGenerator = new PdfReportGenerator();