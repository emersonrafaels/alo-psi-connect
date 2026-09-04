import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Pencil,
  MessageCircle,
  BarChart3,
  Lock,
  Zap,
  ArrowRight,
} from "lucide-react";

import buddyImg from "@/assets/buddy/buddy-sketch.png";

export default function EmotionalCheckinHome() { const navigate = useNavigate();
  return (
    
    <>
      <section className="emotional-home">
        <div className="emotional-home__container">
          {/* Badge */}
          <div className="emotional-home__badge">
            <Heart size={18} strokeWidth={2.2} />
            <span>Diário Emocional</span>
          </div>

          {/* Título */}
          <h2 className="emotional-home__title">
            Seu check-in diário,
            <br />
            <span>do seu jeito.</span>
          </h2>

          {/* Steps */}
          <div className="emotional-home__steps">
            {/* Step 1 */}
            <div className="emotional-home__step emotional-home__step--active">
              <div className="emotional-home__step-icon emotional-home__step-icon--active">
                <Pencil size={19} />
              </div>

              <div className="emotional-home__step-number">1</div>

              <span>Registrar</span>
            </div>

            <div className="emotional-home__connector" />

            {/* Step 2 */}
            <div className="emotional-home__step">
              <div className="emotional-home__step-icon">
                <MessageCircle size={19} />
              </div>

              <div className="emotional-home__step-number">2</div>

              <span>Refletir</span>
            </div>

            <div className="emotional-home__connector" />

            {/* Step 3 */}
            <div className="emotional-home__step emotional-home__step--wide">
              <div className="emotional-home__step-icon">
                <BarChart3 size={19} />
              </div>

              <div className="emotional-home__step-number">3</div>

              <span>Perceber padrões</span>
            </div>

            <div className="emotional-home__connector" />

            {/* Step 4 */}
            <div className="emotional-home__step">
              <div className="emotional-home__step-icon">
                <Heart size={19} />
              </div>

              <div className="emotional-home__step-number">4</div>

              <span>Cuidar de si</span>
            </div>
          </div>

          {/* Card principal */}
          <div className="emotional-home__card">
            {/* brilho interno */}
            <div className="emotional-home__card-glow" />

            {/* conteúdo */}
            <div className="emotional-home__content">
              <span className="emotional-home__eyebrow">
                PASSO 1 · REGISTRAR
              </span>

              <h3 className="emotional-home__card-title">
                Conte como você
                <br />
                está se sentindo hoje.
              </h3>

              <p className="emotional-home__description">
                Registre suas emoções e os momentos que marcaram seu dia.
                Em poucos cliques, você cria o hábito de olhar para si
                com mais atenção e gentileza.
              </p>

              <div className="emotional-home__benefits">
                <div className="emotional-home__benefit">
                  <Lock size={17} />
                  <span>Privado</span>
                </div>

                <div className="emotional-home__benefit">
                  <Zap size={18} />
                  <span>Rápido</span>
                </div>

                <div className="emotional-home__benefit">
                  <Heart size={18} />
                  <span>Acolhedor</span>
                </div>
              </div>
            </div>

            {/* elementos decorativos */}
            <div className="emotional-home__floating emotional-home__floating--smile">
              <div className="emotional-home__smile">☺</div>
            </div>

            <div className="emotional-home__sparkle emotional-home__sparkle--one">
              ✦
            </div>

            <div className="emotional-home__sparkle emotional-home__sparkle--two">
              ✦
            </div>

            <div className="emotional-home__floating emotional-home__floating--note">
              <Heart size={22} fill="currentColor" />
              <div className="emotional-home__note-line emotional-home__note-line--one" />
              <div className="emotional-home__note-line emotional-home__note-line--two" />
            </div>

            {/* Buddy */}
            <div className="emotional-home__buddy">
              <img
                src={buddyImg}
                alt="Buddy registrando emoções no Diário Emocional"
              />
            </div>
          </div>

          {/* CTA */}
          <button
  className="emotional-home__cta"
  onClick={() => navigate("/diario-emocional/experiencia")}
>
  <span>Começar agora</span>
  <ArrowRight size={21} />
</button>

<button
  className="emotional-home__learn-more"
  onClick={() => navigate("/sobre")}
>
  Saiba mais
</button>
        </div>
      </section>

      <style>{`
        .emotional-home {
          width: 100%;
          padding: 72px 20px 68px;

          background:
            radial-gradient(
              circle at 50% 35%,
              rgba(236, 211, 255, 0.30),
              transparent 34%
            ),
            #ffffff;

          overflow: hidden;
        }

        .emotional-home__container {
          width: min(1050px, 100%);
          margin: 0 auto;

          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* =========================
           BADGE
        ========================= */

        .emotional-home__badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;

          padding: 10px 22px;

          margin-bottom: 20px;

          border-radius: 999px;

          background:
            linear-gradient(
              135deg,
              rgba(241, 230, 255, 0.94),
              rgba(251, 231, 249, 0.96)
            );

          color: #6123a8;

          font-size: 15px;
          font-weight: 700;

          box-shadow:
            0 5px 18px rgba(95, 42, 164, 0.07);
        }

        /* =========================
           TÍTULO
        ========================= */

        .emotional-home__title {
          margin: 0 0 38px;

          text-align: center;

          color: #2d0c67;

          font-size: clamp(42px, 5vw, 60px);
          font-weight: 800;
          line-height: 1.03;
          letter-spacing: -0.045em;
        }

        .emotional-home__title span {
          background:
            linear-gradient(
              90deg,
              #7741df 0%,
              #d739c1 52%,
              #ef4c94 100%
            );

          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* =========================
           STEPS
        ========================= */

        .emotional-home__steps {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 28px;
        }

        .emotional-home__step {
          min-width: 205px;
          height: 74px;

          padding: 9px 22px 9px 10px;

          display: flex;
          align-items: center;

          gap: 12px;

          border-radius: 24px;

          background:
            linear-gradient(
              135deg,
              rgba(248, 241, 255, 0.96),
              rgba(246, 237, 254, 0.86)
            );

          color: #8b6ab7;

          font-size: 15px;
          font-weight: 500;

          border: 1px solid rgba(119, 65, 223, 0.04);

          box-shadow:
            inset 0 1px 1px rgba(255,255,255,0.8);
        }

        .emotional-home__step--wide {
          min-width: 290px;
        }

        .emotional-home__step--active {
          color: #ffffff;

          background:
            linear-gradient(
              120deg,
              #4f13b7 0%,
              #7727d9 48%,
              #d73ecc 100%
            );

          box-shadow:
            0 12px 28px rgba(99, 34, 175, 0.25);
        }

        .emotional-home__step-icon {
          width: 44px;
          height: 44px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          background: rgba(255,255,255,0.72);

          color: #7340c3;
        }

        .emotional-home__step-icon--active {
          background: #ffffff;
          color: #7130c8;

          box-shadow:
            0 5px 15px rgba(48, 4, 101, 0.18);
        }

        .emotional-home__step-number {
          width: 25px;
          height: 25px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border-radius: 50%;

          background: rgba(255,255,255,0.64);

          color: #7652b2;

          font-size: 12px;
          font-weight: 700;
        }

        .emotional-home__step--active .emotional-home__step-number {
          background: #ffffff;
          color: #5c1db2;
        }

        .emotional-home__connector {
          width: 28px;
          height: 2px;

          margin: 0 6px;

          border-top: 3px dotted rgba(119, 65, 223, 0.15);
        }

        /* =========================
           CARD
        ========================= */

        .emotional-home__card {
          position: relative;

          width: 100%;
          min-height: 355px;

          overflow: hidden;

          display: flex;
          align-items: center;

          padding: 44px 48px;

          border-radius: 28px;

          background:
            linear-gradient(
              112deg,
              rgba(251, 246, 255, 0.98) 0%,
              rgba(247, 231, 255, 0.98) 51%,
              rgba(253, 224, 246, 0.98) 100%
            );

          border:
            1px solid rgba(112, 46, 174, 0.08);

          box-shadow:
            0 18px 45px rgba(97, 35, 150, 0.06);
        }

        .emotional-home__card::before {
          content: "";

          position: absolute;

          width: 650px;
          height: 650px;

          border-radius: 50%;

          right: -300px;
          top: -280px;

          border:
            1px solid rgba(255,255,255,0.68);

          pointer-events: none;
        }

        .emotional-home__card::after {
          content: "";

          position: absolute;

          width: 720px;
          height: 360px;

          left: 200px;
          bottom: -225px;

          border-radius: 50%;

          border:
            1px solid rgba(255,255,255,0.70);

          transform: rotate(-12deg);

          pointer-events: none;
        }

        .emotional-home__card-glow {
          position: absolute;

          width: 520px;
          height: 520px;

          right: 40px;
          top: -120px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(199, 117, 255, 0.20),
              transparent 65%
            );

          filter: blur(10px);

          pointer-events: none;
        }

        /* =========================
           CARD CONTENT
        ========================= */

        .emotional-home__content {
          position: relative;
          z-index: 3;

          width: 48%;
        }

        .emotional-home__eyebrow {
          display: block;

          margin-bottom: 17px;

          color: #d344ac;

          font-size: 14px;
          font-weight: 800;
        }

        .emotional-home__card-title {
          margin: 0 0 19px;

          color: #27105d;

          font-size: clamp(30px, 3vw, 38px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.035em;
        }

        .emotional-home__description {
          max-width: 430px;

          margin: 0;

          color: #565060;

          font-size: 15px;
          line-height: 1.55;
        }

        /* =========================
           BENEFITS
        ========================= */

        .emotional-home__benefits {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;

          margin-top: 28px;
        }

        .emotional-home__benefit {
          min-height: 42px;

          padding: 10px 17px;

          display: flex;
          align-items: center;
          gap: 9px;

          border-radius: 999px;

          background:
            rgba(255,255,255,0.80);

          color: #6330aa;

          font-size: 13px;
          font-weight: 700;

          box-shadow:
            0 6px 18px rgba(87, 28, 140, 0.07);

          border:
            1px solid rgba(255,255,255,0.75);
        }

        /* =========================
           BUDDY
        ========================= */

        .emotional-home__buddy {
          position: absolute;

          right: 85px;
          bottom: -6px;

          width: 390px;

          z-index: 4;
        }

        .emotional-home__buddy img {
          display: block;

          width: 100%;
          height: auto;

          object-fit: contain;

          filter:
            drop-shadow(
              0 16px 20px rgba(76, 24, 123, 0.14)
            );
        }

        /* =========================
           DECORAÇÕES
        ========================= */

        .emotional-home__floating {
          position: absolute;

          z-index: 2;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            rgba(255,255,255,0.68);

          border:
            1px solid rgba(255,255,255,0.78);

          backdrop-filter: blur(8px);

          box-shadow:
            0 10px 25px rgba(101, 42, 162, 0.08);
        }

        .emotional-home__floating--smile {
          width: 90px;
          height: 78px;

          right: 425px;
          top: 42px;

          border-radius: 18px;
        }

        .emotional-home__smile {
          width: 44px;
          height: 44px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          color: #9753dd;

          font-size: 28px;
        }

        .emotional-home__floating--note {
          width: 105px;
          height: 94px;

          right: 38px;
          bottom: 50px;

          padding: 18px;

          align-items: flex-start;
          flex-direction: column;

          border-radius: 18px;

          color: #a85ce0;
        }

        .emotional-home__note-line {
          height: 5px;

          margin-top: 9px;

          border-radius: 999px;

          background: rgba(151, 83, 221, 0.20);
        }

        .emotional-home__note-line--one {
          width: 61px;
        }

        .emotional-home__note-line--two {
          width: 47px;
        }

        .emotional-home__sparkle {
          position: absolute;

          z-index: 3;

          color: #a968e3;

          font-size: 25px;
        }

        .emotional-home__sparkle--one {
          right: 485px;
          top: 165px;
        }

        .emotional-home__sparkle--two {
          right: 104px;
          top: 54px;

          color: #ed70bc;

          font-size: 30px;
        }

        /* =========================
           CTA
        ========================= */

        .emotional-home__cta {
          width: 355px;
          min-height: 58px;

          margin-top: 29px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 34px;

          border: none;
          border-radius: 999px;

          cursor: pointer;

          background:
            linear-gradient(
              90deg,
              #4d0dab 0%,
              #6d20c9 55%,
              #8b27d4 100%
            );

          color: #ffffff;

          font-size: 16px;
          font-weight: 600;

          box-shadow:
            0 11px 28px rgba(87, 24, 153, 0.20);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .emotional-home__cta:hover {
          transform: translateY(-2px);

          box-shadow:
            0 15px 32px rgba(87, 24, 153, 0.26);
        }

        .emotional-home__learn-more {
          margin-top: 14px;

          border: none;
          background: none;

          color: #6330a9;

          font-size: 15px;
          font-weight: 500;

          text-decoration: underline;

          cursor: pointer;
        }

        /* =========================
           RESPONSIVO
        ========================= */

        @media (max-width: 1050px) {
          .emotional-home__steps {
            gap: 8px;
          }

          .emotional-home__connector {
            display: none;
          }

          .emotional-home__step {
            min-width: 0;
            flex: 1;

            padding-right: 12px;
          }

          .emotional-home__step--wide {
            min-width: 0;
          }

          .emotional-home__buddy {
            right: 30px;
            width: 360px;
          }

          .emotional-home__floating--smile {
            display: none;
          }
        }

        @media (max-width: 820px) {
          .emotional-home {
            padding: 56px 16px;
          }

          .emotional-home__title {
            margin-bottom: 30px;
          }

          .emotional-home__steps {
            overflow-x: auto;

            justify-content: flex-start;

            padding-bottom: 8px;
          }

          .emotional-home__step {
            flex: 0 0 auto;
            min-width: 180px;
            height: 65px;
          }

          .emotional-home__step--wide {
            min-width: 230px;
          }

          .emotional-home__card {
            min-height: 640px;

            align-items: flex-start;

            padding: 34px 28px;
          }

          .emotional-home__content {
            width: 100%;
          }

          .emotional-home__description {
            max-width: 100%;
          }

          .emotional-home__buddy {
            right: 50%;
            transform: translateX(50%);

            bottom: -10px;

            width: min(390px, 88%);
          }

          .emotional-home__floating--note,
          .emotional-home__sparkle {
            display: none;
          }
        }

        @media (max-width: 540px) {
          .emotional-home {
            padding-left: 12px;
            padding-right: 12px;
          }

          .emotional-home__badge {
            padding: 9px 17px;

            font-size: 13px;
          }

          .emotional-home__title {
            font-size: 39px;
          }

          .emotional-home__card {
            min-height: 610px;

            padding:
              30px 21px
              0;
          }

          .emotional-home__card-title {
            font-size: 29px;
          }

          .emotional-home__description {
            font-size: 14px;
          }

          .emotional-home__benefits {
            gap: 8px;
          }

          .emotional-home__benefit {
            padding: 9px 13px;

            font-size: 12px;
          }

          .emotional-home__buddy {
            width: 315px;
          }

          .emotional-home__cta {
            width: min(355px, 92%);
          }
        }
      `}</style>
    </>
  );
}