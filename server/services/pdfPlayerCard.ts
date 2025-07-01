import * as fs from 'fs';
import * as path from 'path';

export class PDFPlayerCard {
  
  async generatePlayerCard(playerData: any): Promise<string> {
    // Generate HTML template for PDF
    const htmlTemplate = this.generateHTMLTemplate(playerData);
    
    // For now, return the HTML - in production would use Puppeteer to generate PDF
    return htmlTemplate;
  }

  private generateHTMLTemplate(player: any): string {
    const percentiles = player.percentiles || {};
    const strengths = player.strengths || [];
    const weaknesses = player.weaknesses || [];
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profil Joueur - ${player.Player || 'Joueur'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            min-height: 100vh;
            padding: 20px;
        }
        
        .player-card {
            max-width: 800px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }
        
        .header {
            background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%);
            padding: 30px;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255,255,255,0.1) 10px,
                rgba(255,255,255,0.1) 20px
            );
        }
        
        .player-name {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 1;
            position: relative;
        }
        
        .player-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            z-index: 1;
            position: relative;
        }
        
        .team-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .team-logo {
            width: 50px;
            height: 50px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .basic-info {
            text-align: right;
        }
        
        .value-badge {
            background: #00e676;
            color: #000;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 18px;
        }
        
        .content {
            padding: 30px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .stats-section {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
        }
        
        .section-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #e91e63;
            text-align: center;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding: 10px;
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
        }
        
        .stat-label {
            font-weight: 500;
        }
        
        .stat-value {
            font-weight: bold;
            font-size: 18px;
        }
        
        .percentile-bar {
            width: 60px;
            height: 8px;
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
            overflow: hidden;
            margin-left: 10px;
        }
        
        .percentile-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .percentile-excellent {
            background: linear-gradient(90deg, #00e676, #4caf50);
        }
        
        .percentile-good {
            background: linear-gradient(90deg, #ffeb3b, #ff9800);
        }
        
        .percentile-average {
            background: linear-gradient(90deg, #ff9800, #f44336);
        }
        
        .percentile-poor {
            background: linear-gradient(90deg, #f44336, #9c27b0);
        }
        
        .position-field {
            background: rgba(76, 175, 80, 0.1);
            border: 2px solid #4caf50;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        
        .field-diagram {
            width: 120px;
            height: 80px;
            border: 2px solid #4caf50;
            border-radius: 8px;
            margin: 0 auto 15px;
            position: relative;
            background: linear-gradient(180deg, #2e7d32 0%, #388e3c 100%);
        }
        
        .player-position {
            position: absolute;
            width: 12px;
            height: 12px;
            background: #e91e63;
            border-radius: 50%;
            top: 50%;
            left: 20%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 10px rgba(233, 30, 99, 0.8);
        }
        
        .strengths-weaknesses {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 30px;
        }
        
        .strength-item, .weakness-item {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .strength-item {
            background: linear-gradient(90deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.1));
            border-left: 4px solid #4caf50;
        }
        
        .weakness-item {
            background: linear-gradient(90deg, rgba(244, 67, 54, 0.2), rgba(244, 67, 54, 0.1));
            border-left: 4px solid #f44336;
        }
        
        .overall-rating {
            text-align: center;
            background: linear-gradient(135deg, #3f51b5, #9c27b0);
            border-radius: 15px;
            padding: 25px;
            margin: 20px 0;
        }
        
        .rating-circle {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: conic-gradient(#e91e63 0deg, #e91e63 ${(player.overallRating || 75) * 3.6}deg, rgba(255,255,255,0.2) ${(player.overallRating || 75) * 3.6}deg);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            position: relative;
        }
        
        .rating-inner {
            width: 80px;
            height: 80px;
            background: #1e293b;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
        }
        
        .footer {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #ccc;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
                background: white;
                color: black;
            }
            
            .player-card {
                box-shadow: none;
                border: 1px solid #ddd;
            }
        }
    </style>
</head>
<body>
    <div class="player-card">
        <div class="header">
            <div class="player-name">${player.Player || 'Joueur'}</div>
            <div class="player-info">
                <div class="team-info">
                    <div class="team-logo">${(player.Squad || 'FC').substring(0, 2).toUpperCase()}</div>
                    <div>
                        <div style="font-size: 18px; font-weight: bold;">${player.Squad || 'Club'}</div>
                        <div style="font-size: 14px; opacity: 0.9;">${player.Comp || 'Ligue'}</div>
                    </div>
                </div>
                <div class="basic-info">
                    <div style="font-size: 16px; margin-bottom: 5px;">${player.Age || '--'} ANS</div>
                    <div style="font-size: 14px; margin-bottom: 10px;">Poste: ${player.Pos || '--'}</div>
                    <div class="value-badge">Note: ${player.overallRating || 75}/100</div>
                </div>
            </div>
        </div>
        
        <div class="content">
            <div class="position-field">
                <div class="field-diagram">
                    <div class="player-position"></div>
                </div>
                <div style="font-weight: bold; font-size: 18px;">Poste Principal: ${player.Pos || 'Milieu'}</div>
            </div>
            
            <div class="overall-rating">
                <div class="rating-circle">
                    <div class="rating-inner">${player.overallRating || 75}</div>
                </div>
                <div style="font-size: 20px; font-weight: bold;">Note Globale</div>
            </div>
            
            <div class="stats-grid">
                <div class="stats-section">
                    <div class="section-title">Statistiques Offensives</div>
                    <div class="stat-item">
                        <span class="stat-label">Buts</span>
                        <div style="display: flex; align-items: center;">
                            <span class="stat-value">${player.Gls || 0}</span>
                            <div class="percentile-bar">
                                <div class="percentile-fill ${this.getPercentileClass(percentiles.Gls)}" 
                                     style="width: ${percentiles.Gls || 0}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Passes décisives</span>
                        <div style="display: flex; align-items: center;">
                            <span class="stat-value">${player.Ast || 0}</span>
                            <div class="percentile-bar">
                                <div class="percentile-fill ${this.getPercentileClass(percentiles.Ast)}" 
                                     style="width: ${percentiles.Ast || 0}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">xG (Expected Goals)</span>
                        <div style="display: flex; align-items: center;">
                            <span class="stat-value">${player.xG || 0}</span>
                            <div class="percentile-bar">
                                <div class="percentile-fill ${this.getPercentileClass(percentiles.xG)}" 
                                     style="width: ${percentiles.xG || 0}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Tirs/90min</span>
                        <div style="display: flex; align-items: center;">
                            <span class="stat-value">${player['Sh/90'] || 0}</span>
                            <div class="percentile-bar">
                                <div class="percentile-fill ${this.getPercentileClass(percentiles['Sh/90'])}" 
                                     style="width: ${percentiles['Sh/90'] || 0}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="stats-section">
                    <div class="section-title">Statistiques Défensives</div>
                    <div class="stat-item">
                        <span class="stat-label">Tacles</span>
                        <div style="display: flex; align-items: center;">
                            <span class="stat-value">${player.Tkl || 0}</span>
                            <div class="percentile-bar">
                                <div class="percentile-fill ${this.getPercentileClass(percentiles.Tkl)}" 
                                     style="width: ${percentiles.Tkl || 0}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Interceptions</span>
                        <div style="display: flex; align-items: center;">
                            <span class="stat-value">${player.Int || 0}</span>
                            <div class="percentile-bar">
                                <div class="percentile-fill ${this.getPercentileClass(percentiles.Int)}" 
                                     style="width: ${percentiles.Int || 0}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Dégagements</span>
                        <div style="display: flex; align-items: center;">
                            <span class="stat-value">${player.Clr || 0}</span>
                            <div class="percentile-bar">
                                <div class="percentile-fill ${this.getPercentileClass(percentiles.Clr)}" 
                                     style="width: ${percentiles.Clr || 0}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Duels aériens</span>
                        <div style="display: flex; align-items: center;">
                            <span class="stat-value">${player.Won || 0}</span>
                            <div class="percentile-bar">
                                <div class="percentile-fill ${this.getPercentileClass(percentiles.Won)}" 
                                     style="width: ${percentiles.Won || 0}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stats-section">
                    <div class="section-title">Performance Technique</div>
                    <div class="stat-item">
                        <span class="stat-label">% Passes réussies</span>
                        <div style="display: flex; align-items: center;">
                            <span class="stat-value">${player['Cmp%'] || 0}%</span>
                            <div class="percentile-bar">
                                <div class="percentile-fill ${this.getPercentileClass(percentiles['Cmp%'])}" 
                                     style="width: ${percentiles['Cmp%'] || 0}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Touches de balle</span>
                        <div style="display: flex; align-items: center;">
                            <span class="stat-value">${player.Touches || 0}</span>
                            <div class="percentile-bar">
                                <div class="percentile-fill ${this.getPercentileClass(percentiles.Touches)}" 
                                     style="width: ${percentiles.Touches || 0}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Portées de balle</span>
                        <div style="display: flex; align-items: center;">
                            <span class="stat-value">${player.Carries || 0}</span>
                            <div class="percentile-bar">
                                <div class="percentile-fill ${this.getPercentileClass(percentiles.Carries)}" 
                                     style="width: ${percentiles.Carries || 0}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Actions progressives</span>
                        <div style="display: flex; align-items: center;">
                            <span class="stat-value">${player.PrgC || 0}</span>
                            <div class="percentile-bar">
                                <div class="percentile-fill ${this.getPercentileClass(percentiles.PrgC)}" 
                                     style="width: ${percentiles.PrgC || 0}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="stats-section">
                    <div class="section-title">Informations de Base</div>
                    <div class="stat-item">
                        <span class="stat-label">Matchs joués</span>
                        <span class="stat-value">${player.MP || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Titularisations</span>
                        <span class="stat-value">${player.Starts || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Minutes jouées</span>
                        <span class="stat-value">${player.Min || 0}'</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Cartons jaunes</span>
                        <span class="stat-value">${player.CrdY || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Cartons rouges</span>
                        <span class="stat-value">${player.CrdR || 0}</span>
                    </div>
                </div>
            </div>
            
            <div class="strengths-weaknesses">
                <div class="stats-section">
                    <div class="section-title">Points Forts</div>
                    ${strengths.slice(0, 5).map((strength: string) => 
                        `<div class="strength-item">${strength}</div>`
                    ).join('')}
                </div>
                
                <div class="stats-section">
                    <div class="section-title">Points à Améliorer</div>
                    ${weaknesses.slice(0, 5).map((weakness: string) => 
                        `<div class="weakness-item">${weakness}</div>`
                    ).join('')}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div>Données de performance saison 2024/2025 • Source: Football Analytics Platform</div>
            <div style="margin-top: 10px;">Toutes les statistiques sont ramenées à 90 minutes • Percentiles par rapport aux joueurs du même poste</div>
        </div>
    </div>
</body>
</html>`;
  }

  private getPercentileClass(percentile: number): string {
    if (percentile >= 80) return 'percentile-excellent';
    if (percentile >= 60) return 'percentile-good';
    if (percentile >= 40) return 'percentile-average';
    return 'percentile-poor';
  }
}

export const pdfPlayerCard = new PDFPlayerCard();