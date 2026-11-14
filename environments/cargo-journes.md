# Cargo journeys between environments

For our Flame in Freefall challenge, cargo traffic matters because the same item encounters different fire conditions as it moves—and as people unpack, charge, repair or use it. A tool that travels powered off inside a container presents a different assessment from that tool charging beside supplies in a breathable habitat.

This extends the team's existing [cargo passport concept](../docs/cargo-passport.md). The scenarios below are illustrative research cases, not confirmed mission routes or safety findings.

## Possible cargo journeys

| Scenario | What moves and why | What changes for fire safety | What the passport should explain |
|---|---|---|---|
| Earth → lunar surface habitat | Food, clothing, instruments, cables and spare batteries support an expedition. Cargo may arrive directly in a lander. | Earth gravity gives way to microgravity during transit and approximately one-sixth gravity on the surface. Packaging, atmosphere and operating state can also change. | Which evidence applies to transport, unpacking, storage and use—and where lunar conditions lack supporting tests. |
| Earth → lunar orbital habitat → surface | An instrument is received in orbit and transferred to a lander. Gateway's earlier design provides a reference scenario. | Several enclosed spaces have their own ventilation, atmosphere, storage arrangements and response provisions. The final leg adds partial gravity. | Whether evidence covers every occupied vehicle and habitat along the route, rather than only the final destination. |
| Lunar habitat → pressurized rover → habitat | Astronauts take tools, sample containers and spare equipment on a field expedition. | Gravity stays the same, but cabin volume, airflow, nearby materials and access to equipment differ. | Whether an item's intended rover use is covered; habitat evidence alone does not establish that. |
| Outdoor surface equipment → indoor workshop | A crew brings a drill or robot component inside for servicing. | Equipment enters an oxygen-containing cabin. Dust, damage and prior thermal exposure may matter; maintenance can expose internal parts. | What changed in the item's condition and configuration before indoor inspection, operation or charging. |
| Earth → Mars surface, before crew arrival | Supplies, instruments and replacement parts are delivered ahead of people. | Long storage and unattended operation introduce questions about condition on arrival and first activation. | Storage history, monitoring records, inspection requirements and missing evidence for commissioning after storage. |
| Mars transit/orbital habitat → Martian surface | Instruments and expedition supplies descend with the crew or separately. | Microgravity changes to approximately 0.38g. Cabin atmosphere, ventilation and use may change independently. | Which orbital research remains relevant and which conclusions require partial-gravity evidence. |
| Surface → orbit → Earth | Selected samples, used instruments and failed components return for analysis. | The return cargo differs from what departed: containers now contain samples; equipment may be worn, modified or damaged. | The actual return configuration, containment and condition—not just the original outbound record. |
| One surface base → another | A hypothetical transfer supplies a replacement instrument or urgently needed spare. | Gravity may match while receiving-site atmosphere, interfaces, permitted uses and documentation differ. | Whether the receiving facility has applicable evidence and an attributed acceptance decision. Cross-program transfers are a hypothetical extension. |

A Moon-to-Mars supply route could also be explored, but it requires assumptions about production, transport and infrastructure that our existing materials do not establish. It is unnecessary for demonstrating the cargo-passport concept.

## ISS departures to lunar destinations: evidence review

**Web review: 14 November 2026.** There is published speculation about shipping cargo from the ISS to the Moon, but the sources reviewed do **not establish an operating or announced ISS → Gateway, ISS → NASA lunar base, or ISS → China-led ILRS service**. This is a bounded research finding, not proof that no proposal exists. The map includes these three connections as **illustrative / hypothetical**, with possible cargo rather than mission manifests.

| Map route | Finding from the reviewed sources | How to use it in this project |
|---|---|---|
| **R22 · ISS → Lunar Gateway** | NASA's 2020 logistics award describes Dragon XL departing a Falcon Heavy upper stage for Gateway. It does not describe collecting cargo at the ISS. ISS research and Gateway cargo-handling simulations do not establish a flight between them. [W1][W3] | Hypothetical transfer of an ISS-used instrument or spare. Transfer vehicle, docking arrangements and acceptance remain unspecified. |
| **R23 · ISS → NASA lunar base** | NASA's 2026 surface plan describes deliveries through lunar payload services and cargo-capable landers; it does not identify the ISS as a cargo departure point. A 2017 paper proposes a generic Earth–ISS–Moon system, without establishing a NASA-base service. [W2][W5] | Hypothetical onward shipment of equipment after ISS use. Requires an identified lunar transfer vehicle and lander; a Gateway stop is not assumed. |
| **R24 · ISS → China-led ILRS** | The official ILRS description identifies Earth, lunar-orbit and surface sections, with Earth–Moon round-trip transport. It does not identify an ISS connection. Its lunar-orbit section is not NASA's Gateway. [W4] | Hypothetical cross-program transfer of an instrument or spare. Transport, interfaces, receiving-program agreement and acceptance are unresolved. |

**What the evidence does support:** Earth → Gateway logistics in the earlier architecture (R04); Gateway ↔ lunar surface expedition transfers in that architecture (R06/R07); and planned Earth → lunar surface deliveries (R08/R10). NASA announced its intention to pause Gateway in its current form on 24 March 2026, so the earlier Gateway routes remain historical planning references. [W1][W2] The existing [Gateway note](../docs/environments/lunar-gateway.md) explains the lander transfers.

**Why similar search results can mislead:** NASA's ISAAC project tested robots on the ISS and simulated cargo movement between Gateway and a docked vehicle. That is technology development, not an ISS-to-Gateway shipment. [W3] Likewise, a spacecraft family serving both destinations does not establish a flight between them. “Low Earth orbit” also does not necessarily mean a stop at the ISS.

**Published proposal, with limits:** Khoshyaran's 2017 *A Newtonian Logistic System for the Earth-ISS-Moon Cargo Delivery* proposes ISS modifications and a slingshot/tug system for onward lunar cargo. It is evidence that someone proposed the broad route, not evidence of an adopted agency architecture, demonstrated transport capability, or service to any of our three named destinations. Its engineering feasibility was not validated in this review. [W5]

For example, a crew could hypothetically pack an ISS-tested instrument for a lunar habitat. The passport would need its actual wear, repairs, battery state and shipping configuration, followed by evidence for each transfer vehicle and the receiving cabin. Moving from ISS microgravity to lunar partial gravity would need an applicability review; ISS use alone does not qualify the instrument for surface use. This example is a research scenario, not a reported shipment.

An ISS → Earth return followed by a separate Earth → Moon launch is another conceivable sequence. Existing arrows describe those legs separately; they do not establish that a particular returned item was relaunched. R22–R24 represent hypothetical onward transfers without an Earth return, not a hidden return-and-relaunch itinerary. No reciprocal lunar → ISS service is inferred.

### Web sources for this review

- **[W1] NASA, 27 March 2020:** [NASA Awards Artemis Contract for Gateway Logistics Services](https://www.nasa.gov/news-release/nasa-awards-artemis-contract-for-gateway-logistics-services/). Earlier Gateway delivery architecture; historical schedules are not current commitments.
- **[W2] NASA, 24 March 2026:** [NASA Unveils Initiatives to Achieve America’s National Space Policy](https://www.nasa.gov/news-release/nasa-unveils-initiatives-to-achieve-americas-national-space-policy/). Gateway pause intention and phased surface-base deliveries.
- **[W3] NASA:** [Integrated System for Autonomous and Adaptive Caretaking (ISAAC)](https://www.nasa.gov/integrated-system-for-autonomous-and-adaptive-caretaking-isaac/). ISS demonstrations and simulated Gateway cargo handling.
- **[W4] State Council / Xinhua, 25 April 2024:** [China unveils International Lunar Research Station details](https://english.www.gov.cn/news/202404/25/content_WS662a42bdc6d0868f4e8e66f0.html). Reports the lunar program chief's description of ILRS sections and Earth–Moon transport; historical targets are not confirmed completion dates.
- **[W5] M. M. Khoshyaran, 15 July 2017, Journal of Space Exploration 6(2):125:** [A Newtonian Logistic System for the Earth-ISS-Moon Cargo Delivery](https://www.tsijournals.com/articles/a-newtonian-logistic-system-for-the-earthissmoon-cargo-delivery-13338.html). Speculative proposal; publisher-indexed text was available through web search after direct page access timed out.

## Follow one item through its changing uses

A battery-powered geological instrument makes the differences concrete:

| Stage | Illustrative action | Question the reviewer needs answered |
|---|---|---|
| Packed on Earth | A technician secures the instrument, battery and protective packaging. | Does the evidence describe this complete shipping configuration? |
| In transit | The instrument remains stowed and powered off. | What evidence covers the battery, packaging and enclosure during transport? |
| Received at a habitat | A crew member removes the packaging and inspects the instrument. | Has anything been damaged, and what materials are now exposed? |
| Charging indoors | The instrument connects to a charger in the workshop. | Does the evidence cover this battery–charger combination, heat generation and surroundings? |
| Used outside | An astronaut operates it during fieldwork. | What exposure, damage or modifications must be recorded before its next indoor use? |
| Returned for repair | The instrument comes back with a fault or replacement component. | Which earlier findings still apply to its changed condition? |

The important transition can happen without a journey: moving from “stored” to “charging” in the same room can warrant another evidence review. Conversely, changing location does not automatically mean every existing test becomes irrelevant.

## How NASA research supports these scenarios

The dashboard could connect each stage to relevant evidence already identified in our research:

- **BASS/BASS-II and Saffire:** combustion and flame-spread evidence relevant to exposed solid materials and packaging, where material and test conditions match.
- **SAME/SAME-R:** smoke-characterization evidence relevant to detection questions.
- **FLEX:** droplet-combustion and extinction research relevant to suppression research, with explicit limits on transfer to cargo assemblies or battery failures.

A useful result would read:

> Related material evidence is available under microgravity conditions. Applicability to this assembled instrument, its charging state and the proposed lunar atmosphere remains unresolved.

This is illustrative wording, not a completed evidence assessment. It is more defensible than assigning an unsupported fire probability. Our research brief identifies no direct partial-gravity combustion data in the PSI collection; Earth and microgravity results should not be assumed to provide safe upper and lower limits for lunar or Martian behaviour.

## Proposed first demonstration

Follow one instrument travelling from Earth to a lunar habitat, then into a rover and back for charging. It covers transport, environmental changes and changing use while keeping the evidence review understandable. A Mars journey can then show the additional consequences of long storage and limited resupply.

This is a proposed demonstration for the team's existing cargo-passport concept, not an implemented feature or a selected mission manifest.

## Sources and limits

The scenario discussion also uses the repository's existing research:

- [Cargo passport](../docs/cargo-passport.md)
- [Challenge research brief](../docs/research-brief.md)
- [NASA lunar surface base](../docs/environments/lunar-base-nasa.md)
- [China's planned lunar base](../docs/environments/lunar-base-china.md)
- [Lunar Gateway](../docs/environments/lunar-gateway.md)
- [Martian surface base](../docs/environments/martian-base-nasa.md)
- [Martian orbital habitat](../docs/environments/martian-orbital-station-nasa.md)
- [International Space Station](../docs/environments/iss.md)

The ISS-to-lunar route review above checks selected public sources; other scenarios were not exhaustively reverified, and cargo volumes were not calculated. These scenarios organize evidence for review and do not establish flight acceptance or operational safety.

**SI disclosure:** Written with AI assistance from the team's existing concept, repository research and the linked web sources.
