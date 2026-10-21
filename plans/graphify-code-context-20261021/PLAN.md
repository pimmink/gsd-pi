# GSD Pi — Graphify, brongebonden codecontext en MCP

Herzien contributieplan · versie 3.1 · 21 oktober 2026 · expliciete agent-handoff.

> [!IMPORTANT]
> Dit is een upstream-RFC en publicatiepakket, geen geleverde adapter of geaccepteerde architectuur. De operator heeft publicatie van de umbrella en alle zeven child issues gevraagd, na een volledige review. Dat publicatiebesluit activeert geen implementatie en vervangt geen maintainergoedkeuring.

## 0. Voortbouwen op wat GSD al heeft

GSD bevat `/gsd graphify` al als native promptworkflow. Dit plan voegt die command niet opnieuw toe: het bouwt voort op de bestaande dispatcher, build/query/status/diff-werkwijze en gemergede freshness-/edgeverduidelijking uit #2862. Een externe Graphify-Labs-provider, vertrouwde source-indexbinding en geselecteerde MCP-uitbreiding zijn mogelijke vervolglagen; het bestaande command bewijst niet dat die provider is geïnstalleerd of een nieuwe adapterconventie is geaccepteerd.

Alle acht issues zijn expliciet voor agents geoptimaliseerd: bovenaan staan startpunt, concrete outputs, volgorde, overdracht en gates. C01 is bewust documentatiegericht. De overige children bevatten concrete runtime-/provider-/consumer-/diagnostiekdelta's of uitvoerbare verificatie zodra hun scope wordt geactiveerd; het geheel is dus geen documentatie-only project. Labels zoals `documentation`, `enhancement` en `needs-triage` zijn classificatie/triage, geen vervanging voor de body of maintainergoedkeuring.

## 1. Aanbeveling en afbakening

Behoud één uitkomstneutrale umbrella voor **optionele, brongebonden codecontext voor expliciet gekozen GSD-consumenten**, met Graphify als eerste evaluatiekandidaat. De hoofdvraag blijft:

> Welke aantoonbare taak of host krijgt met bestaande skill-, CLI-, bronzoek- en afzonderlijke MCP-routes onvoldoende betrouwbare, begrensde broncontext, en wat is de kleinste onderhoudbare oplossing?

Onderzoek bestaande routes eerst. Een bestaande-route/documentatie-uitkomst, een externe extensie/companion, een kleine geaccepteerde core-seam of gemotiveerd uitstel zijn alle geldig. Nieuwe infrastructuur, providerafhankelijkheden, automatische extractie, een daemon of transportmigratie zijn geen vooraf gekozen resultaat.

| Eigenaarschap | Grens |
| --- | --- |
| GSD Pi upstream | RFC, keuze van een eventuele grens, bestaande workflow-/toolcontracten en geaccepteerde integratie |
| Externe Graphify-provider | Extractie, eigen versies/schema, index en eventueel providerprotocol |
| Projectadapter of companion | Vertrouwde configuratie, bronselectie en mapping voor de geaccepteerde route |
| GSD-workflowdatabase | Blijft autoriteit voor lifecycle, toestemming en verificatie |
| Dit plan | Analyse, agent-opneembare issuecontracten en publicatiebewijs; geen implementatie- of adoptiebewijs |

Dit werk hoort bij de GSD Pi-contributies, niet bij Edelman-applicatiemijlpalen. Er worden geen applicatievereisten als gevalideerd gemarkeerd en geen GSD-lifecyclestatussen gewijzigd.

## 2. Herijking van de aangeleverde versie

| Onderwerp | Versie 2, 19 oktober | Herziening, 21 oktober |
| --- | --- | --- |
| Source baseline | `b6d7c31f2c32168b8073cb321f2b5f114b394d76` | `ee286ce386f79acc240e7fbbe10ece892cedc534`, vóór publicatie opnieuw op relevante drift controleren |
| Grafinventaris | Drie grafen; native Pi-tool en standalone MCP-tool onvoldoende onderscheiden | Vier oppervlakken, inclusief de native memory-tool en MCP-alias |
| Freshnessfix | #2857/#2862 reeds geleverd | Blijft uitgangspunt; geen nieuw bugissue voor die geleverde scope |
| Delegatieconventie | Nieuwe ontwerpvraag, geen bestaande afspraak | Maintainerdeferral opnieuw gelezen; #2858 nog open, dus alleen werkelijk overlappende documentatie coördineren |
| Canonieke MCP-projectcontext | Bestaande fundering | #2667 nu expliciet als gesloten/geleverd behandelen; geen herimplementatie |
| Bronbinding | Repository/worktree/index moesten kloppen | Vertrouwde hostmapping apart van optionele workflow-rootvalidatie en externe state-root expliciet maken |
| Providercontract | Adaptercontract vóór referentieadapter | C03-A doet eerst read-only haalbaarheid; dat informeert C02 voordat het contract bevriest |
| Consument | MCP- en native routes als mogelijkheden | Elke gekozen route krijgt een eigenaar en apart bewijs; registratie betekent niet beschikbaarheid in elke parent/child of host |
| SDK | Geen implementatieversie vastgelegd | Source baseline gebruikt SDK 1.x/lock 1.29.0; v2/main-voorbeelden zijn geen compatibiliteitsbewijs |
| Verificatie | C07 als werkstroom | Vroege bewijsafspraak én tests in iedere eigenaar-PR; late cross-boundary adoptie apart |
| Publicatie | Alleen geactiveerde children publiceren aanbevolen | Operator vraagt alle zeven issues; daarom volledige backlog met zichtbare ontwerp-/implementatiegates, zonder fictieve acceptatie |

### 2.1 Vier verschillende grafoppervlakken

| Oppervlak | Geobserveerd in de geselecteerde bron | Betekenis |
| --- | --- | --- |
| `/gsd graphify` | Dispatch van een prompt; maakt de knowledge-directory; prompt noemt nodes/edges, dirty/untracked bronstatus en statische edgebeperkingen | Geen automatische aanroep naar Graphify-Labs en geen gegarandeerd side-effectvrije nieuwe status-API |
| Native Pi `gsd_graph`, MCP `gsd_memory_graph` | Memoryrelaties/supersedes; native build is niet de standalone projectgraph-builder | Hetzelfde toolwoord kan per host een ander contract betekenen |
| Standalone MCP `gsd_graph`, CLI `gsd graph` | Project-/workflowgraaf via eigen readers en `.gsd/graphs/graph.json` | Geen source-callgraph en geen externe Graphify-index |
| Externe Graphify | Eigen extractie/index/interface | Alleen afgeleid navigatiebewijs; compatibiliteit en side effects moeten voor de gekozen versie worden aangetoond |

Een graph-edge op basis van een import is geen bewezen call. Statische bronrelaties zijn geen runtime-traces, deploymentbewijs, toestemming of geslaagde Task-verificatie.

### 2.2 Opnieuw gecontroleerde overlap

| Werk | Geobserveerde stand | Afhandeling |
| --- | --- | --- |
| #2857 / #2862 | Issue gesloten; promptfix gemerged | Niet opnieuw openen voor de geleverde freshness-/edge-scope |
| #2858 | Open; head `e5f5e32033e89b78dd87d9fff6fae9c8bdf830c7` bij controle | Geen geaccepteerde adapterconventie uit afleiden; alleen werkelijke overlap afstemmen |
| #2666 / #2667 | Umbrella open; canonieke native guard-child gesloten | Gebruik huidige fundering; sluit geen oude issues via deze RFC |
| #2671 / #2672 | Open hostbewijs-scopes | Gebruik of breid de receptuur zichtbaar uit voor de gekozen graph-route; geen generieke hostclaim |
| #2810 | Gesloten ownership-fix | Huidige command/debug/actieve-unitgrens behouden |
| #2822 | Open subagent-observability/cost-umbrella | C06 mag geen duplicaat daarvan worden |
| #2913 / #2932 | Afzonderlijk TUI-/blockerontwerp | Navigatie geeft geen uitvoerings- of approvalautoriteit |
| #2948 / #2951 | Afzonderlijke blockerfixes en runtimepatches | GFM-bodies opgefrist; niet claimen dat Graphify die fixes levert |

MCP-search gaf nul resultaten voor het bekende Graphify-issue #2857. Dat is geen bewijs van afwezigheid. Na die aantoonbare zoekkloof is een begrensde `gh issue list`-enumeratie gebruikt: 1.000 issues, nummerbereik 566–2950, plus directe herlezing van relevante issues/PR's. Deze dekking is niet repository-breed of toekomstbestendig; ieder issue eist een actuele overlap-/claimcontrole vóór pickup.

### 2.3 Bronnen en beperkingen van het onderzoek

- De relevante upstream-diff sinds de oude baseline is bekeken. De native Graphify-prompt/handler bleef bruikbaar als bronbasis; MCP-registration, authority/routing en command-ownership hebben wel relevante wijzigingen.
- Een onafhankelijke broninventaris en planningsaudit zijn uitgevoerd. Het eerste Luna-inventarisproces leverde geen geldig eindantwoord; een expliciet begrensde Sol-medium vervanging leverde de inventaris. Dat is geen kwaliteitsbenchmark.
- Context7 is geraadpleegd voor Graphify- en MCP-SDK-documentatie. De huidige SDK-main-documentatie bevat andere/v2-API-vormen; die worden niet als implementatieautoriteit voor de huidige 1.x-checkout gebruikt.
- De applicatie-Graphify-index was stale; de query weigerde terecht. Er is geen rebuild of succesvolle graph-query geclaimd. De projectwrapper is hoogstens privé prior art; publieke issues bevatten geen klantassets of private bronexcerpten.
- Er is voor deze planpublicatie geen provider geïnstalleerd, index gebouwd, betaalde inferentie uitgevoerd, nieuw MCP-endpoint gestart of producttest als geslaagd voorgesteld.

## 3. Geobserveerde integratiegrenzen

### 3.1 Canonieke state, source en index zijn verschillende identiteiten

De bestaande MCP-validator controleert absolute paden, realpath en — indien geconfigureerd — containment onder `GSD_WORKFLOW_PROJECT_ROOT`. Hij kent ook de externe `.gsd`-state-root. Dat vormt **geen onafhankelijke binding** aan de gekozen source-worktree en providerindex. Dit is geen nieuw aangetoonde kwetsbaarheid in dat bestaande gedrag; de nieuwe bronread heeft een eigen contract nodig.

Het ontwerp moet host-vertrouwd vastleggen:

1. Welke canonieke projectidentiteit wordt gelezen?
2. Welke source-repository en worktree is geselecteerd/toegestaan?
3. Welke index/provideridentiteit hoort daarbij en wie heeft dat onafhankelijk gecontroleerd?
4. Welke inputscope/fingerprint, producer-/schemaversie en indexrevisie onderbouwen freshness?
5. Wat gebeurt er bij symlinkescape, gedeelde common Git-dir, sibling worktree of wijzigingen tijdens de read?

Een provider die zijn eigen root terugstuurt bewijst niet dat de host de juiste bron heeft gekozen.

### 3.2 Bestaande context is geen externe indexfreshness

`CODEBASE.md` heeft bestaande discovery/fingerprint/TTL- en contextbudgetlogica. De structural fingerprint bevat onder meer paths, repository-identifiers en opties, niet automatisch alle gewijzigde source-inhoud. Bestaande workflow-graph-inlining bestaat eveneens. Die oppervlakken zijn hergebruik-/vergelijkingsmateriaal, geen bewijs dat een externe source-index fresh is of dat codecontextcompositie ontbreekt.

C05 mag daarom niet onvoorwaardelijk een tweede globale contextinjectie toevoegen. Kies een concrete taakscope en bewezen gat, behoud bounded fallback en meet werkelijk nut/overhead. Karakterlimieten zijn geen gemeten token- of kostenbudget.

### 3.3 Packaging en consumers zijn echte werkpakketten

Een allowlist-, catalogus- of registryregel bewijst niet dat een gewone GSD-parent, child, VS Code/Copilot-route of externe MCP-host de tool kan ontdekken en aanroepen. De gekozen route moet expliciet worden bekabeld en afzonderlijk geverifieerd.

De huidige MCP-fundering en canonieke native guard uit #2667 blijven bestaan. Native Pi memory-graph, standalone project-graph en een toekomstige source-contextread krijgen geen stilzwijgend uitwisselbare schema's. De SDK-versie, schema-normalisatie, `isError`, structured/text output en abortsignaal worden tegen de werkelijke packageversie getest; deze RFC is geen SDK-/transportupgrade.

## 4. Uitkomstneutrale beslissingen

| Uitkomst | Wanneer passend | Verwacht resultaat |
| --- | --- | --- |
| R0: bestaande routes | Bestaande skill/CLI/bronzoek-/afzonderlijke MCP-route voldoet | Documentatie/recept en geaccepteerd geen-nieuwe-core-besluit |
| R1: externe companion/extensie | Een extra mapping is nuttig maar core-grens niet nodig | Expliciete eigenaar/trustgrens en onderhoud buiten core |
| R2: minimale geaccepteerde core-seam | Concrete consumentbehoefte kan niet redelijk via bestaande extensiepunten | Klein contract, generieke seam, opt-in provider en geselecteerde consumerwiring |
| Uitstel/afwijzing | Vertrouwen, privacy, kwaliteit of onderhoudskosten niet onderbouwd | Gemotiveerd geaccepteerd besluit; geen fake implementatie of bewijs |

U-A t/m U-G in de umbrella beschrijven de echte maintainer-/contract-/adoptiegates. Lokale aliasnamen zijn geen nieuwe GSD-decision-, requirement- of work-register-ID's.

## 5. Werkboom en startbaarheid

| Alias | Resultaat | Nu opneembaar | Implementatievoorwaarde |
| --- | --- | --- | --- |
| U | [#2953](https://github.com/open-gsd/gsd-pi/issues/2953) | RFC-coördinatie, consument-/routebesluit | Geen impliciete featureacceptatie |
| C01 | [#2954](https://github.com/open-gsd/gsd-pi/issues/2954) | Vier-oppervlakkeninventaris en echte docs-gaps | Geen duplicaatfix; overlap #2858 respecteren |
| C02 | [#2955](https://github.com/open-gsd/gsd-pi/issues/2955) | Ontwerpvragen en begrensde fixtures | C03-A haalbaarheid + echte plaatsings-/trust-/contractgoedkeuring |
| C03 | [#2956](https://github.com/open-gsd/gsd-pi/issues/2956) | Fase A: read-only providerfeasibility | Fase B: geaccepteerde C02-seam; opt-in referentie-integratie |
| C04 | [#2957](https://github.com/open-gsd/gsd-pi/issues/2957) | Gekozen MCP-consument inventariseren | Geaccepteerd contract/providerpad/consumer; geen automatische native registratie |
| C05 | [#2958](https://github.com/open-gsd/gsd-pi/issues/2958) | Noodzaak van extra taakcontext aantonen | Apart post-pilot besluit, geen verplichte global prompt tax |
| C06 | [#2959](https://github.com/open-gsd/gsd-pi/issues/2959) | Bestaande diagnostiek inventariseren | Alleen ontbrekende dimensies en nieuwe scope na bewijs/akkoord |
| C07 | [#2960](https://github.com/open-gsd/gsd-pi/issues/2960) | Fase A: bewijs-/fixturerecept | Fase B: activated-route bewijs; iedere eigenaar-PR heeft eigen tests |

C03-A informeert C02; C03-B wacht op C02. Dat voorkomt een contract dat vóór providerhaalbaarheid wordt bevroren, zonder een cyclische whole-issue dependency te verzinnen. C05-runtimecompositie vereist het C07-B phase-one pilotbewijscheckpoint van de gekozen basisroute en een gekoppeld post-pilot behoeftebesluit, niet sluiting van het gehele C07-issue. C07 kan later geactiveerd C05-werk verifiëren; C05-onderzoek/fixtureontwerp kan al starten. C07 is geen dumpplaats voor alle tests aan het einde. C05/C06 blijven echt voorwaardelijk.

Alle issuebodies bevatten actuele-state/claim-preflight, bronankers, concrete outputs/eigenaarsbestanden, stappen, non-goals, acceptatie, negative/boundary-matrix, passende testharness-voorbeelden en bewijsbeperkingen. Verificatiecommando's in die bodies zijn instructies voor toekomstig werk, geen al uitgevoerde resultaten.

## 6. Contract- en veiligheidsvragen die vóór runtimecode vaststaan

| Dimensie | Vereiste beslissing |
| --- | --- |
| Versie/states | Ondersteunde versies en legale combinaties van beschikbaarheid, executie, freshness en dekking; onbekend blijft onbekend |
| Limieten | Requested/effective limits, query/citation/output-budget, aparte stdout/stderr-caps, truncation en invalid encoding |
| Identity/freshness | Onafhankelijke hostbinding, relevante dirty/untracked inputs, producer/schema/indexrevision en check/use-races |
| Coverage | Gescopeerde volledigheid, unresolved/ambiguous doelen, unsupported inputs en echte nulresultaten versus fouten |
| Process trust | Trusted code, gevalideerde artifactreads of containment; vaste argv en `shell: false` zijn geen sandbox |
| Execution | Environment-allowlisting, deadline, cancellation/process tree, queue/concurrency en connection-close |
| Privacy | Geen secrets/klantassets, onbetrouwbare provider-/repotekst, bounded redacted diagnostics en geen willekeurige model-URLs/roots/executables |
| Side effects | Reads vragen geen install/build/refresh/extraction/inference/write/service-start; disabled mode vereist geen keys of binaries |
| Remote/auth | Alleen na expliciete route-/trustkeuze; geen impliciete network/spend of nieuw onbeveiligd endpoint |
| Authority | Graphbewijs geeft geen approval, canonical Attempt, Technical Verdict, release- of live-UAT-bewijs |

Selectieve directorychecks zijn nuttig bewijs over die paden, maar geen bewijs dat willekeurige providerprocessen nergens kunnen schrijven. Het threat model moet die beperking eerlijk maken.

## 7. Bewijsstrategie en overdracht

| Bewijslaag | Wat moet blijken | Niet voldoende als vervanging |
| --- | --- | --- |
| Bestaande-routebaseline | Dezelfde bekende taak en bronfixture, begrensde context, correcte relaties/antwoorden | Alleen een synthetische happy-path-query |
| Fake contract | Afwijzing verkeerde root/schema, stale/unknown/partial/empty, budgets, races, cancellation, privacy | Geen echte Graphify-interoperabiliteit |
| Echte provider/parser | Versiegebonden geschoonde fixtures en bekende code-only bronwaarheid | Geen package- of hostaanroep |
| Package/optional absence | Geïnstalleerde distributie zonder provider werkt; opt-in pad zonder repo-only imports | Alleen buildgroen |
| Geselecteerde echte host | Werkelijke discovery/invocation, protocol-/abortgedrag en sourcebinding in elke geclaimde route | Alleen screenshot, beschikbaarheidslijst of configbestand |
| Kwaliteit/overhead | Correcte antwoorden, contextomvang, latency en relevante onderhouds-/kostenlast | Geen universele kwaliteits-/kostenclaim uit één run |

Gebruik bestaande Node/compiled workspaceharness en versiecompatibele docs. Ontbrekende workspace-`dist`-prerequisites zijn een setupfout, geen bewezen productregressie. Publieke fixtures zijn klein, geschoond en licentiegeschikt. Expliciet niet-uitgevoerde real-host- of providerchecks blijven niet-uitgevoerd.

## 8. Review-, publicatie- en afsluitcontract

1. Voltooi en controleer U en C01–C07 als één pakket.
2. Laat bronbinding, architectuur/non-duplication én agent-pickup/bewijs onafhankelijk reviewen.
3. Verwerk blocking bevindingen; valideer GFM, links, placeholders, gates, bronankers en scope.
4. Controleer relevante upstream-drift en actuele claims opnieuw.
5. Open pas daarna umbrella en zeven children; ken geen fictieve eigenaar/goedkeuring toe.
6. Koppel native sub-issues indien ondersteund en toegestaan; rapporteer een echte capability-/permissiongap eerlijk.
7. Render daadwerkelijke links, lees alle bodies terug en verifieer de native relatie en issue-state.
8. Werk deze planversie en de lokale oorspronkelijke download bij met de werkelijke publicatiereceipt; behoud een byte-identieke lokale backup van versie 2.

Afsluiten van de toekomstige umbrella vereist een expliciet geaccepteerde R0/R1/R2/uitsteluitkomst plus current proof voor alle geactiveerde scopes en een zichtbare disposition voor voorwaardelijke/niet-geactiveerde children. Publicatie zelf sluit geen inhoudelijk werk en geen bestaande issues.

## 9. Behoud van de eerdere input

| Eerder onderwerp | Plaats in versie 3 |
| --- | --- |
| G1 native versus externe routes | C01, vier-oppervlakkenmatrix, maintainergate en #2858-overlap |
| G2 bestaande skill-/graphdiagnostiek | Voorwaardelijke C06, current subagent/MCP/sessioninventaris en #2822 |
| G3 optionele adapter en MCP bij echte behoefte | R0/R1/R2, U-A–U-G, C02/C03-A/B/C04 en conditional C05 |
| G4 generieke parent/child-verificatierecepten | C07 vroeg ontwerp, owner-PR-tests en late geselecteerde hostacceptatie |
| Queryselectie, paging, resolutie, fingerprints | C02/C03 contract/fixturevragen; geen onterecht universele providerclaim |
| Geen geforceerd `suggest`-beleid | Geen uitbreiding van native suggest-/buildbeleid; nieuwe impliciete inferentie is out of scope |
| MCP als optionele transportlaag | C04 alleen bij gekozen consument; geen nieuwe default daemon of SDK-upgrade |
| Failure/negative tests en proof classes | Standalone childmatrices en §7 |
| RFC kan met bestaande routes eindigen | R0/uitstel en expliciete no-change-/stopuitkomst in ieder relevant child |
| Eerdere bronfeiten en aanbevelingen gescheiden | Gedateerde sourcebaseline, current issue-state, voorgestelde contracten en niet-uitgevoerde checks blijven gelabeld |

## 10. Publicatiegegevens

Gecontroleerd op `2026-10-21T13:30:38.084157+00:00`. Alle acht bodies noemen bovenaan de bestaande native Graphify-basis en hun agent-geoptimaliseerde handoff, volgorde, concrete outputs en gates.

| Alias | Gepubliceerd issue | Gecontroleerde status |
| --- | --- | --- |
| U | [#2953 — [RFC/Umbrella]: Build on GSD's existing Graphify workflow with optional source-bound code context](https://github.com/open-gsd/gsd-pi/issues/2953) | OPEN; body/titel/ID exact teruggelezen |
| C01 | [#2954 — [Docs]: Clarify native, memory, workflow and external graph contracts](https://github.com/open-gsd/gsd-pi/issues/2954) | OPEN; body/titel/ID exact teruggelezen |
| C02 | [#2955 — [Design/Feature]: Define the bounded optional code-context contract and approved seam](https://github.com/open-gsd/gsd-pi/issues/2955) | OPEN; body/titel/ID exact teruggelezen |
| C03 | [#2956 — [Feature]: Evaluate Graphify feasibility and the approved opt-in reference route](https://github.com/open-gsd/gsd-pi/issues/2956) | OPEN; body/titel/ID exact teruggelezen |
| C04 | [#2957 — [Feature]: Expose approved code-context reads through the selected MCP route](https://github.com/open-gsd/gsd-pi/issues/2957) | OPEN; body/titel/ID exact teruggelezen |
| C05 | [#2958 — [Proposal]: Compose task-scoped code context only after a demonstrated pilot gap](https://github.com/open-gsd/gsd-pi/issues/2958) | OPEN; body/titel/ID exact teruggelezen |
| C06 | [#2959 — [Proposal]: Add only demonstrated code-context diagnostic gaps](https://github.com/open-gsd/gsd-pi/issues/2959) | OPEN; body/titel/ID exact teruggelezen |
| C07 | [#2960 — [Validation]: Verify provider, package and selected-host code-context adoption](https://github.com/open-gsd/gsd-pi/issues/2960) | OPEN; body/titel/ID exact teruggelezen |

> [!WARNING]
> De zeven children zijn volledig onderling en aan de umbrella gelinkt, maar de native sub-issue-relatie is niet tot stand gebracht. GitHub gaf bij het toevoegen HTTP 404 via MCP én de begrensde fallback; de native lijst bleef leeg. De exacte access/capability-oorzaak is niet vastgesteld. Dit is ook expliciet in de umbrella vermeld; een bevoegde repository-maintainer moet de native koppeling verifiëren of leggen. Er is geen privilege- of tokenescalatie uitgevoerd.

De issuebodies zijn het actuele agent-pickupcontract. `documentation`, `enhancement` en `needs-triage` zijn classificatie/triage, geen geaccepteerde implementatie of voltooiing. De nieuwe source-graph-feature, providerinteroperabiliteit en hostadoptie zijn niet door deze publicatie geleverd.

## Artifactindeling en bewijsgrens

- `U.md` en `C01.md`–`C07.md`: gereviewde templates; `rendered/` bevat de exact gepubliceerde huidige bodies.
- `publication.json`: canonieke huidige body-hashes, echte issue-identiteiten, OPEN-readback en native-koppellimiet.
- `manifest.json` en `final-render-manifest.json`: historische publicatiefasen; `agent-handoff-v2-manifest.json` is de huidige agent-first bodyversie.
- `REVIEW.md`, `validate.mjs` en `render.mjs`: review-/format-/bronankerbewijs, geen product- of provideracceptatie.
- Lokale ruwe transportreceipts en de downloadbackup blijven lokaal; publicatie vereist geen private applicatie-assets.

De oorspronkelijke versie 2 is byte-identiek lokaal bewaard. Dit volledige versie-3.1-document is opgebouwd uit het bijgewerkte plan en alle acht daadwerkelijk teruggelezen issuecontracten.
