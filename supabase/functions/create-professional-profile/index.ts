// Version: 1.0.3 - Fixed getUserByEmail error (replaced with profiles check + orphan cleanup)
// Last updated: 2025-10-15
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getBccEmails } from "../_shared/get-bcc-emails.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to clean profile data for UPDATE operations
function cleanProfileDataForUpdate(data: any): any {
  const cleanData = { ...data };
  
  // Remove immutable fields that should never be updated
  delete cleanData.id;
  delete cleanData.user_id;
  delete cleanData.created_at;
  
  // SEMPRE forçar tipo_usuario como profissional em cadastros/updates profissionais
  cleanData.tipo_usuario = 'profissional';
  
  console.log('🧹 Cleaned profile data for update:', {
    original_keys: Object.keys(data),
    cleaned_keys: Object.keys(cleanData),
    forcing_tipo_usuario: 'profissional'
  });
  
  return cleanData;
}

// Helper function to clean professional data for UPDATE operations
function cleanProfessionalDataForUpdate(data: any): any {
  const cleanData = { ...data };
  
  // Remove immutable fields that should never be updated
  delete cleanData.id;
  delete cleanData.user_id;
  delete cleanData.profile_id;
  delete cleanData.created_at;
  
  console.log('🧹 Cleaned professional data for update:', {
    original_keys: Object.keys(data),
    cleaned_keys: Object.keys(cleanData)
  });
  
  return cleanData;
}

// Helper function to save failed registration attempt
async function saveFailedAttempt(
  supabase: any,
  email: string,
  nome: string,
  tenantId: string,
  formData: any,
  errorMessage: string,
  status: 'failed' | 'incomplete' | 'duplicate'
) {
  try {
    const { error } = await supabase
      .from('professional_registration_attempts')
      .insert({
        email,
        nome,
        tenant_id: tenantId,
        form_data: formData,
        status,
        error_message: errorMessage,
        notification_sent: false
      });
    
    if (error) {
      console.error('❌ Erro ao salvar tentativa falha:', error);
    } else {
      console.log('✅ Tentativa falha salva para análise');
    }
  } catch (err) {
    console.error('❌ Exceção ao salvar tentativa:', err);
  }
}

// Helper function to send abandonment emails
async function sendAbandonmentEmails(
  supabase: any,
  professionalEmail: string,
  professionalName: string,
  tenant: any,
  errorMessage: string
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY não configurado');
    return;
  }

  try {
    // 📧 Email 1: Para o profissional
    const professionalEmailHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
            <h2 style="color: #dc2626;">⚠️ Ops! Algo deu errado no seu cadastro</h2>
            <p>Olá, <strong>${professionalName}</strong>,</p>
            <p>Identificamos um problema ao processar seu cadastro na plataforma <strong>${tenant.name}</strong>.</p>
            
            <div style="background: #fef3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>Erro encontrado:</strong> ${errorMessage}</p>
            </div>
            
            <p><strong>O que fazer agora?</strong></p>
            <ul>
              <li>Verifique se preencheu todos os campos obrigatórios</li>
              <li>Confirme se o email e CPF estão corretos</li>
              <li>Tente novamente em alguns minutos</li>
            </ul>
            
            <p>Se o problema persistir, <strong>entre em contato conosco</strong> e nossa equipe te ajudará a concluir o cadastro!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Email: ${tenant.contact_email || 'contato@alopsi.com.br'}<br>
                WhatsApp: ${tenant.contact_whatsapp || 'Não disponível'}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // 📧 Email 2: Para a equipe Medcos (no email da Alopsi)
    const teamEmailHtml = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
            <h2 style="color: #dc2626;">🚨 Cadastro Profissional Abandonado</h2>
            
            <div style="background: #fee; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 0;"><strong>Profissional:</strong> ${professionalName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Email:</strong> ${professionalEmail}</p>
              <p style="margin: 5px 0 0 0;"><strong>Tenant:</strong> ${tenant.name} (${tenant.slug})</p>
            </div>
            
            <h3 style="color: #991b1b;">Erro técnico:</h3>
            <pre style="background: #f9fafb; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 12px;">${errorMessage}</pre>
            
            <div style="background: #fef3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>⚠️ Ação necessária:</strong> Entre em contato com o profissional para ajudá-lo a concluir o cadastro!</p>
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              💡 <strong>Dica:</strong> Verifique a tabela <code>professional_registration_attempts</code> no banco para mais detalhes.
            </p>
          </div>
        </body>
      </html>
    `;

    // Enviar emails via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${tenant.name} <noreply@redebemestar.com.br>`,
        to: [professionalEmail],
        subject: `⚠️ Problema no seu cadastro - ${tenant.name}`,
        html: professionalEmailHtml,
      }),
    });

    const teamResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Sistema Rede Bem-Estar <noreply@redebemestar.com.br>`,
        to: [tenant.contact_email || 'contato@alopsi.com.br'],
        subject: `🚨 Cadastro Abandonado: ${professionalName} (${tenant.name})`,
        html: teamEmailHtml,
      }),
    });

    if (response.ok && teamResponse.ok) {
      console.log('✅ Emails de abandono enviados com sucesso');
      
      // Marcar notificação como enviada
      await supabase
        .from('professional_registration_attempts')
        .update({ 
          notification_sent: true,
          notification_sent_at: new Date().toISOString()
        })
        .eq('email', professionalEmail)
        .order('created_at', { ascending: false })
        .limit(1);
    } else {
      console.error('❌ Erro ao enviar emails via Resend');
    }

  } catch (emailError) {
    console.error('❌ Exceção ao enviar emails:', emailError);
  }
}

// Helper para gerar email HTML dinâmico baseado no tenant
function generateConfirmationEmailHTML(
  tenantName: string,
  tenantColor: string,
  tenantLogo: string | null,
  recipientName: string,
  confirmationUrl: string,
  isProfessional: boolean = false
): string {
  const primaryColor = tenantColor.startsWith('#') ? tenantColor : `hsl(${tenantColor})`;
  const welcomeTitle = isProfessional ? '🎉 Bem-vindo à nossa equipe!' : `Bem-vindo ao ${tenantName}!`;
  const welcomeMessage = isProfessional
    ? `Obrigado por se cadastrar como profissional! Sua conta foi criada com sucesso em nossa plataforma. Estamos muito felizes em tê-lo(a) conosco!`
    : `Obrigado por se cadastrar! Para ativar sua conta, confirme seu email clicando no botão abaixo:`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme seu email - ${tenantName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); padding: 40px 20px; text-align: center;">
            ${tenantLogo 
              ? `<img src="${tenantLogo}" alt="${tenantName}" style="max-height: 60px; margin-bottom: 15px;" />` 
              : `<h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${tenantName}</h1>`
            }
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Conectando você ao cuidado</p>
          </div>
          <div style="padding: 40px 20px;">
            <h2 style="color: ${primaryColor}; margin: 0 0 20px 0; font-size: 24px;">${welcomeTitle}</h2>
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">Olá, <strong>${recipientName}</strong>!</p>
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #4b5563;">${welcomeMessage}</p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid ${primaryColor};">
              <p style="margin: 0; font-size: 16px; color: #4b5563;">Para começar a utilizar todos os recursos da plataforma, confirme seu email clicando no botão abaixo:</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">✅ Confirmar Email</a>
            </div>
            <div style="background-color: #fef3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #a16207;"><strong>⏰ Importante:</strong> Este link expira em 24 horas por segurança.</p>
            </div>
            <p style="margin: 20px 0; font-size: 14px; color: #6b7280;">Se você não solicitou este cadastro, pode ignorar este email com segurança.</p>
          </div>
          <div style="background-color: #f8fafc; padding: 25px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #6b7280; margin: 0; font-size: 13px;">Enviado com 💙 pela equipe do <strong>${tenantName}</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  // Use service role to bypass RLS
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  let requestData: any;
  let detectedTenant: any;
  
  try {
    requestData = await req.json();
    const { profileData, professionalData, horariosData, formacoes, userId, tenantSlug: requestTenantSlug } = requestData;

    // Detect tenant from multiple sources
    const origin = req.headers.get('origin') || '';
    const referer = req.headers.get('referer') || '';

    console.log('🔍 Tenant Detection:', { 
      origin, 
      referer, 
      requestTenantSlug,
      method: 'create-professional-profile'
    });

    // Priority: 1. Explicit tenantSlug from request, 2. Referer, 3. Origin, 4. Default
    const tenantSlug = requestTenantSlug || 
      (referer.includes('/medcos') ? 'medcos' : 
       (origin.includes('/medcos') ? 'medcos' : 'alopsi'));

    console.log('✅ Using tenant:', tenantSlug);

    // Fetch tenant data including admin_email for sender
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug, logo_url, primary_color, contact_email, contact_whatsapp, admin_email')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant not found:', tenantError);
      // ✅ CORS headers já incluídos
      return new Response(
        JSON.stringify({ error: 'Tenant não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    detectedTenant = tenant;

    // Normalizar nome para MEDCOS em uppercase
    let normalizedTenantName = tenant.name;
    if (tenantSlug === 'medcos') {
      normalizedTenantName = 'MEDCOS';
    }

    // ✅ NOVO: Criar usuário via Admin API se userId não foi fornecido
    let finalUserId = userId;
    let authUserId = userId; // ✅ UUID do auth.users (separado do ID sequencial)
    let isNewUser = false;

    if (!userId) {
      console.log('🔐 [v1.0.3] Creating new user via Admin API');
      console.log('📧 Email:', profileData.email);
      
      // 🔍 Verificar se o email já existe no perfil
      console.log('🔍 Verificando se email já existe:', profileData.email);
      
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, email')
        .eq('email', profileData.email)
        .maybeSingle();
      
      if (existingProfile) {
        // Verificar se o user_id ainda existe em auth.users
        let userStillExists = false;
        
        if (existingProfile.user_id) {
          try {
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(existingProfile.user_id);
            userStillExists = !!authUser.user;
          } catch (error) {
            console.log('⚠️ user_id não existe em auth.users:', existingProfile.user_id);
          }
        }
        
        if (userStillExists) {
          // Usuário válido já existe
          console.log('❌ Email já cadastrado com usuário válido');
          throw new Error('Email já cadastrado no sistema');
        } else {
          // Perfil órfão - limpar antes de criar novo
          console.log('⚠️ Perfil órfão detectado, removendo:', existingProfile.id);
          
          await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', existingProfile.id);
          
          console.log('✅ Perfil órfão removido, prosseguindo com criação');
        }
      }
      
      console.log('✅ [v1.0.3] Email validation passed, proceeding with user creation');
      
      // Criar usuário via Admin API (bypassa rate limits e não envia email automático)
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: profileData.email,
        password: professionalData.senha, // Senha vem do frontend
        email_confirm: false, // NÃO confirmar automaticamente
        user_metadata: {
          full_name: profileData.nome,
          tipo_usuario: 'profissional'
        }
      });
      
      if (createUserError || !newUser.user) {
        console.error('❌ Error creating user:', createUserError);
        throw new Error(`Erro ao criar conta: ${createUserError?.message}`);
      }
      
      finalUserId = newUser.user.id;
      authUserId = newUser.user.id; // ✅ Armazenar UUID para operações de autenticação
      isNewUser = true;
      console.log('✅ User created successfully:', finalUserId);
      
      // ✅ UPDATE: Link user_id to any orphan profiles for this email
      const { error: linkProfileError } = await supabaseAdmin
        .from('profiles')
        .update({ user_id: finalUserId })
        .eq('email', profileData.email)
        .is('user_id', null);
      
      if (linkProfileError) {
        console.error('⚠️ Warning: Could not link orphan profile:', linkProfileError);
        // Don't throw - continue with registration
      } else {
        console.log('✅ Orphan profiles linked to user_id:', finalUserId);
      }
    }

    console.log('Creating professional profile for user:', finalUserId);

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', finalUserId)
      .single();

    let profile;
    if (existingProfile) {
      console.log('Profile already exists, updating:', existingProfile.id);
      
      // Check for duplicate profiles with same user_id
      const { data: duplicateProfiles, error: duplicateCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, created_at')
        .eq('user_id', finalUserId);
      
      if (!duplicateCheckError && duplicateProfiles && duplicateProfiles.length > 1) {
        console.warn('⚠️ Found duplicate profiles for user_id:', finalUserId, 'Count:', duplicateProfiles.length);
        
        // Keep the oldest profile, delete the rest
        const sortedProfiles = duplicateProfiles.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        const profileToKeep = sortedProfiles[0];
        const profilesToDelete = sortedProfiles.slice(1);
        
        console.log('🗑️ Deleting duplicate profiles, keeping:', profileToKeep.id);
        
        for (const dupProfile of profilesToDelete) {
          await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', dupProfile.id);
          
          console.log('Deleted duplicate profile:', dupProfile.id);
        }
        
        // Update existingProfile reference to the one we kept
        existingProfile.id = profileToKeep.id;
      }
      
      // Clean profile data before update (remove immutable fields)
      const cleanedProfileData = cleanProfileDataForUpdate(profileData);
      
      console.log('[v1.0.1] 📝 Updating profile with separated UPDATE and SELECT operations');
      console.log('[v1.0.1] Profile ID to update:', existingProfile.id);
      console.log('[v1.0.1] Cleaned data keys:', Object.keys(cleanedProfileData));
      
      // Step 1: UPDATE without .select() to avoid ON CONFLICT error
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          ...cleanedProfileData,
          raca: profileData.raca || null,
          sexualidade: profileData.sexualidade || null,
          tenant_id: tenant.id
        })
        .eq('id', existingProfile.id);

      if (updateError) {
        console.error('[v1.0.1] ❌ Profile update error:', updateError);
        console.error('[v1.0.1] Error code:', updateError.code);
        console.error('[v1.0.1] Error message:', updateError.message);
        console.error('[v1.0.1] Error details:', updateError.details);
        throw new Error(`Erro ao atualizar profile: ${updateError.message} (${updateError.code})`);
      }

      console.log('[v1.0.1] ✅ Profile UPDATE executed successfully');

      // Step 2: Fetch updated profile with separate SELECT query
      const { data: updatedProfile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', existingProfile.id)
        .single();

      if (fetchError || !updatedProfile) {
        console.error('[v1.0.1] ❌ Profile fetch error:', fetchError);
        throw new Error('Falha ao buscar profile atualizado');
      }

      console.log('[v1.0.1] ✅ Profile fetched successfully');
      profile = updatedProfile;
    } else {
      // Create new profile
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: authUserId, // ✅ Usar UUID do auth.users
          tenant_id: tenant.id,
          raca: profileData.raca || null,
          sexualidade: profileData.sexualidade || null,
          ...profileData
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }
      profile = newProfile;
    }

    console.log('Profile processed successfully:', profile.id);

    // Get the highest user_id from profissionais table to generate next integer ID
    const { data: maxUserIdData } = await supabaseAdmin
      .from('profissionais')
      .select('user_id')
      .order('user_id', { ascending: false })
      .limit(1);

    const nextUserId = maxUserIdData && maxUserIdData.length > 0 
      ? (maxUserIdData[0].user_id || 0) + 1 
      : 1;

    const professionalId = nextUserId; // ✅ ID inteiro sequencial para tabela profissionais
    console.log('Using professionalId for profissionais table:', professionalId);
    console.log('Using authUserId for auth operations:', authUserId);

    // Check if professional already exists
    const { data: existingProfessional } = await supabaseAdmin
      .from('profissionais')
      .select('*')
      .eq('profile_id', profile.id)
      .single();

    let professional;
    finalUserId = professionalId; // Manter compatibilidade com código existente
    
    if (existingProfessional) {
      console.log('Professional already exists, updating:', existingProfessional.id);
      
      // ⚠️ Se user_id for null, gerar um novo
      if (!existingProfessional.user_id) {
        console.log('⚠️ Existing professional has null user_id, generating new one');
        finalUserId = nextUserId; // Usar o ID gerado
      } else {
        finalUserId = existingProfessional.user_id; // Usar existente
      }
      
      // Clean professional data before update (remove immutable fields)
      const cleanedProfessionalData = cleanProfessionalDataForUpdate(professionalData);
      
      // ✅ Se user_id estava null, incluir no UPDATE
      const dataToUpdate = !existingProfessional.user_id 
        ? { ...cleanedProfessionalData, user_id: finalUserId }
        : cleanedProfessionalData;
      
      console.log('🔍 Professional UPDATE details:', {
        existingUserId: existingProfessional.user_id,
        finalUserId: finalUserId,
        willSetUserId: !existingProfessional.user_id,
        profileId: profile.id
      });
      
      console.log('📝 Updating professional with cleaned data', {
        hasUserId: !existingProfessional.user_id,
        finalUserId: finalUserId
      });
      
      // Update existing professional
      const { data: updatedProfessionals, error: updateError } = await supabaseAdmin
        .from('profissionais')
        .update(dataToUpdate)
        .eq('profile_id', profile.id)
        .select();

      if (updateError) {
        console.error('❌ Professional update error:', updateError);
        console.error('Error code:', updateError.code);
        console.error('Error message:', updateError.message);
        console.error('Error details:', updateError.details);
        throw new Error(`Erro ao atualizar profissional: ${updateError.message} (${updateError.code})`);
      }

      if (!updatedProfessionals || updatedProfessionals.length === 0) {
        throw new Error('Falha ao atualizar profissional - nenhum registro retornado');
      }
      
      console.log('✅ Professional updated successfully. Rows affected:', updatedProfessionals.length);
      professional = updatedProfessionals[0];
    } else {
      // Create new professional with generated integer user_id
      // Remove senha from professionalData as it's not a column in profissionais table
      const { senha, ...professionalDataWithoutPassword } = professionalData;
      
      const { data: newProfessional, error: professionalError } = await supabaseAdmin
        .from('profissionais')
        .insert({
          profile_id: profile.id,
          user_id: nextUserId, // Use generated integer ID
          user_login: profile.email.split('@')[0], // Generate user_login from email
          user_email: profile.email, // Email from profile
          display_name: profile.nome, // Name from profile
          ...professionalDataWithoutPassword
        })
        .select()
        .single();

      if (professionalError) {
        console.error('Professional creation error:', professionalError);
        throw professionalError;
      }
      professional = newProfessional;

      // Create entry in professional_tenants
      const { error: tenantLinkError } = await supabaseAdmin
        .from('professional_tenants')
        .insert({
          professional_id: newProfessional.id,
          tenant_id: tenant.id,
          is_featured: false,
        });

      if (tenantLinkError) {
        console.error('Error linking professional to tenant:', tenantLinkError);
      } else {
        console.log('Professional linked to tenant:', tenantSlug);
      }
    }

    // Sync photo between profissionais and profiles tables
    if (professional?.foto_perfil_url && professional.foto_perfil_url !== profile.foto_perfil_url) {
      console.log('Syncing photo from profissionais to profiles table');
      await supabaseAdmin
        .from('profiles')
        .update({ foto_perfil_url: professional.foto_perfil_url })
        .eq('id', profile.id);
    }

    console.log('Professional processed successfully:', professional.id);

    // Handle schedules if provided
    if (horariosData && horariosData.length > 0) {
      // First, delete existing schedules for this user
      await supabaseAdmin
        .from('profissionais_sessoes')
        .delete()
        .eq('user_id', finalUserId);

      // Map days to database constraint format (mon, tue, wed, etc.)
      const dayMapping: Record<string, string> = {
        'mon': 'mon',
        'tue': 'tue', 
        'wed': 'wed',
        'thu': 'thu',
        'fri': 'fri',
        'sat': 'sat',
        'sun': 'sun',
        // Support for legacy formats
        'monday': 'mon',
        'tuesday': 'tue',
        'wednesday': 'wed', 
        'thursday': 'thu',
        'friday': 'fri',
        'saturday': 'sat',
        'sunday': 'sun',
        'segunda': 'mon',
        'terca': 'tue',
        'quarta': 'wed', 
        'quinta': 'thu',
        'sexta': 'fri',
        'sabado': 'sat',
        'domingo': 'sun'
      };

      const horariosFormatted = horariosData.map((horario: any) => ({
        user_id: finalUserId, // Use the correct user_id
        day: dayMapping[horario.day] || horario.day, // Map to database format
        start_time: horario.startTime,
        end_time: horario.endTime
      }));

      const { error: horariosError } = await supabaseAdmin
        .from('profissionais_sessoes')
        .insert(horariosFormatted);

      if (horariosError) {
        console.error('Schedules creation error:', horariosError);
        throw horariosError;
      }

      console.log('Schedules processed successfully');
    }

    // Handle education entries if provided
    if (formacoes && formacoes.length > 0) {
      console.log('📚 Saving education entries:', formacoes.length);
      
      const educationEntries = formacoes.map((f: any) => ({
        professional_id: professional.id,
        institution_name: f.institution,
        course_name: f.course,
        graduation_year: f.year
      }));

      const { error: educationError } = await supabaseAdmin
        .from('professional_education')
        .insert(educationEntries);

      if (educationError) {
        console.error('Education creation error:', educationError);
        // Don't throw - education is saved but not critical for registration
      } else {
        console.log('✅ Education entries saved successfully');
      }
    }

    // Send confirmation email for new professional users
    let confirmationEmailSent = false;
    isNewUser = false;
    
    try {
      // Only send for authenticated professional registrations
      if (!authUserId) {
        console.log('⏭️ Skipping confirmation email - public registration without auth');
      } else {
        console.log('🔍 Checking if confirmation email should be sent for authUserId:', authUserId);
        
        // Check if user needs email confirmation
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(authUserId); // ✅ Usar UUID do auth.users
        
        if (authError) {
          console.error('❌ Error fetching user for email confirmation:', authError);
        } else if (authUser.user && !authUser.user.email_confirmed_at) {
          // User exists and email not confirmed - SEND CONFIRMATION
          isNewUser = true;
          console.log('📧 Sending confirmation email for professional user:', profileData.email);
          
          // Generate confirmation token
          const confirmationToken = crypto.randomUUID();
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          console.log('🔑 Generated confirmation token:', confirmationToken);

          // Invalidate existing tokens for this user
          const { error: invalidateError } = await supabaseAdmin
            .from('email_confirmation_tokens')
            .update({ used: true })
            .eq('user_id', authUserId) // ✅ Usar UUID do auth.users
            .eq('used', false);

          if (invalidateError) {
            console.error('⚠️ Error invalidating old tokens:', invalidateError);
          } else {
            console.log('✅ Old tokens invalidated successfully');
          }

          // Save new token
          const { error: tokenError } = await supabaseAdmin
            .from('email_confirmation_tokens')
            .insert({
              user_id: authUserId, // ✅ Usar UUID do auth.users
              email: profileData.email,
              token: confirmationToken,
              expires_at: expiresAt.toISOString(),
              used: false
            });

          if (tokenError) {
            console.error('❌ Error saving confirmation token:', tokenError);
          } else {
            console.log('✅ Confirmation token saved successfully');
            
            // Send email via Resend
            const resendApiKey = Deno.env.get('RESEND_API_KEY');
            if (!resendApiKey) {
              console.error('❌ RESEND_API_KEY not configured in environment');
            } else {
              console.log('📬 Preparing to send email via Resend');
              
              const baseUrl = 'https://redebemestar.com.br';
              const tenantPath = tenantSlug === 'medcos' ? '/medcos' : '';
              const confirmationUrl = `${baseUrl}${tenantPath}/auth?confirm=true&token=${confirmationToken}`;

              console.log('🔗 Confirmation URL:', confirmationUrl);
              console.log('📨 Sending to:', profileData.email);
              console.log('🏢 Tenant:', normalizedTenantName, '| Slug:', tenantSlug);

              // Buscar emails BCC configurados
              const bccEmails = await getBccEmails(supabaseAdmin, tenant.id);
              const allBcc = [...(tenant.admin_email ? [tenant.admin_email] : []), ...bccEmails];

              console.log('📧 Email details:', {
                from: `${normalizedTenantName} <noreply@redebemestar.com.br>`,
                to: profileData.email,
                bcc: allBcc,
                subject: `Bem-vindo à ${normalizedTenantName} - Confirme seu email`,
                logo: tenant.logo_url,
                color: tenant.primary_color
              });

              const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: `${normalizedTenantName} <noreply@redebemestar.com.br>`,
                  to: [profileData.email],
                  bcc: allBcc.length > 0 ? allBcc : undefined,
                  subject: `Bem-vindo à ${normalizedTenantName} - Confirme seu email`,
                  html: generateConfirmationEmailHTML(
                    normalizedTenantName,
                    tenant.primary_color,
                    tenant.logo_url,
                    profileData.nome,
                    confirmationUrl,
                    true // isProfessional = true
                  )
                }),
              });

              if (emailResponse.ok) {
                const emailResult = await emailResponse.json();
                confirmationEmailSent = true;
                console.log('✅ Confirmation email sent successfully:', emailResult);
              } else {
                const errorText = await emailResponse.text();
                console.error('❌ Failed to send confirmation email. Status:', emailResponse.status);
                console.error('❌ Error details:', errorText);
              }
            }
          }
        } else {
          console.log('ℹ️ User email already confirmed or user not found');
        }
      }
    } catch (emailError) {
      console.error('💥 Error in confirmation email process:', emailError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: finalUserId,
        profileId: profile.id,
        professionalId: professional.id,
        profile: profile,
        professional: professional,
        confirmationEmailSent,
        isNewUser
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ Function error:', error);
    
    // Get more specific error message
    const errorMessage = error?.message || 'Erro desconhecido';
    const errorDetails = error?.details || error?.code || 'Sem detalhes adicionais';
    
    console.error('Error details:', errorDetails);
    
    // 🔴 SALVAR TENTATIVA FALHA NA TABELA TEMPORÁRIA
    try {
      // Garantir que requestData existe
      const fallbackData = requestData || {};
      const email = fallbackData?.profileData?.email || 
                    fallbackData?.professional?.user_email || 
                    'email_desconhecido';
      const nome = fallbackData?.profileData?.nome || 
                   fallbackData?.professional?.display_name || 
                   'Nome não informado';
      
      const status = error?.code === '23505' ? 'duplicate' : 
                    (!fallbackData?.profileData?.email || !fallbackData?.profileData?.nome) ? 'incomplete' : 
                    'failed';
      
      await saveFailedAttempt(
        supabaseAdmin,
        email,
        nome,
        detectedTenant?.id,
        requestData, // Dados completos do formulário
        errorMessage,
        status
      );
      
      // 📧 ENVIAR EMAILS DE NOTIFICAÇÃO
      if (email !== 'email_desconhecido' && detectedTenant) {
        await sendAbandonmentEmails(
          supabaseAdmin,
          email,
          nome,
          detectedTenant,
          errorMessage
        );
      }
    } catch (saveError) {
      console.error('❌ Erro ao processar falha:', saveError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});