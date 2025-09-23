import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Send, User, Loader2, X } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAIAssistantConfig } from "@/hooks/useAIAssistantConfig"
import { useSystemConfig } from "@/hooks/useSystemConfig"
import { useAuth } from "@/hooks/useAuth"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIAssistantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  professionals?: any[]
}

export const AIAssistantModal = ({ open, onOpenChange, professionals }: AIAssistantModalProps) => {
  const navigate = useNavigate();
  const { getConfig } = useSystemConfig(['n8n_chat']); // Only for N8N configs
  const { aiConfig } = useAIAssistantConfig(); // For AI assistant display configs
  const { user } = useAuth();
  const [sessionId] = useState(() => crypto.randomUUID());
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: aiConfig.initialMessage,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Utility function to create payload from template
  const createPayloadFromTemplate = (template: string, variables: Record<string, any>): any => {
    try {
      // Process template and substitute variables
      const processedTemplate = template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
        const varName = variable.trim();
        const value = variables[varName];
        
        if (value === undefined) {
          console.warn(`Template variable ${varName} not found`);
          return JSON.stringify(null);
        }
        
        // For objects and arrays, return as JSON string without quotes
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        
        // For primitives, return as JSON string
        return JSON.stringify(value);
      });
      
      console.log('Processed template:', processedTemplate);
      return JSON.parse(processedTemplate);
    } catch (error) {
      console.error('Template processing error:', error);
      throw new Error(`Invalid template: ${error.message}`);
    }
  };

  // Retry function with exponential backoff
  const retryWithBackoff = async (
    operation: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    backoffMultiplier: number = 2
  ): Promise<any> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`N8N attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`N8N attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      // Get N8N configurations
      const n8nEnabled = getConfig('n8n_chat', 'enabled', false);
      const n8nWebhookUrl = getConfig('n8n_chat', 'webhook_url', '');
      const fallbackOpenAI = getConfig('n8n_chat', 'fallback_openai', true);
      const timeoutSeconds = getConfig('n8n_chat', 'timeout_seconds', 30);
      const maxRetries = parseInt(getConfig('n8n_chat', 'max_retries', '3'));
      const retryDelay = parseInt(getConfig('n8n_chat', 'retry_delay_ms', '1000'));
      const backoffMultiplier = parseFloat(getConfig('n8n_chat', 'retry_backoff_multiplier', '2'));
      const payloadTemplate = getConfig('n8n_chat', 'payload_template', '');

      let response;
      let success = false;

      // Try N8N first if enabled
      if (n8nEnabled && n8nWebhookUrl) {
        try {
          console.log('Attempting N8N webhook with retry system...');
          
          // Prepare variables for template substitution
          const variables = {
            timestamp: new Date().toISOString(),
            session_id: sessionId,
            user_message: inputMessage,
            context: "busca de profissionais",
            page: window.location.pathname + window.location.search,
            filters: Object.fromEntries(new URLSearchParams(window.location.search)),
            professionals: professionals || []
          };

          // Create payload from database template
          let payload;
          if (payloadTemplate) {
            payload = createPayloadFromTemplate(payloadTemplate, variables);
          } else {
            // Fallback to hardcoded payload if template not found
            payload = {
              event: "ai_chat_message",
              timestamp: variables.timestamp,
              session_id: variables.session_id,
              user: {
                message: variables.user_message,
                context: variables.context,
                page: variables.page,
                filters: variables.filters
              },
              professionals: variables.professionals,
              platform: "alopsi"
            };
          }

          console.log('N8N payload prepared:', payload);

          // Define the N8N operation with timeout
          const n8nOperation = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

            try {
              const n8nResponse = await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'AloPsi-Chat-Assistant'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
              });

              clearTimeout(timeoutId);

              if (!n8nResponse.ok) {
                throw new Error(`N8N HTTP ${n8nResponse.status}: ${n8nResponse.statusText}`);
              }

              const n8nData = await n8nResponse.json();
              return n8nData.response || n8nData.message || 'Resposta recebida do N8N';
            } catch (error) {
              clearTimeout(timeoutId);
              throw error;
            }
          };

          // Execute with retry
          response = await retryWithBackoff(n8nOperation, maxRetries, retryDelay, backoffMultiplier);
          success = true;
          console.log('N8N responded successfully:', response);

        } catch (n8nError) {
          console.error('N8N failed after all retries:', n8nError);
          if (!fallbackOpenAI) {
            throw n8nError;
          }
          console.log('Using OpenAI as fallback...');
        }
      }

      // Fallback para OpenAI se N8N falhou ou não está habilitado
      if (!success) {
        console.log('Calling AI Assistant with payload:', {
          message: inputMessage,
          sessionId: sessionId,
          userId: user?.id,
          professionals: professionals
        });

        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: {
            message: inputMessage,
            sessionId: sessionId,
            userId: user?.id,
            professionals: professionals
          }
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }

        console.log('AI Assistant response:', data);

        if (data && !data.success && data.error) {
          throw new Error(data.error);
        }

        response = data?.response || data;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive"
      })

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col" aria-describedby="ai-assistant-description">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-gradient-primary">
                <AvatarFallback className="text-white">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">
                  {aiConfig.title}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {aiConfig.subtitle}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 bg-gradient-primary flex-shrink-0">
                    <AvatarFallback className="text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-li:text-foreground">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => {
                            // Check if it's an internal link (starts with /)
                            const isInternalLink = href?.startsWith('/');
                            
                            if (isInternalLink) {
                              return (
                                <a 
                                  href={href}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-all duration-200 no-underline hover:scale-105 border border-primary/20"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigate(href || '/');
                                  }}
                                >
                                  {children}
                                  <span className="text-xs">→</span>
                                </a>
                              );
                            }
                            
                            return (
                              <a 
                                href={href} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-medium decoration-2 underline-offset-2"
                              >
                                {children}
                              </a>
                            );
                          },
                          h3: ({ children }) => (
                            <h3 className="text-lg font-bold text-foreground mt-4 mb-2 flex items-center gap-2">
                              {children}
                            </h3>
                          ),
                          ul: ({ children }) => (
                            <ul className="space-y-1 my-2">
                              {children}
                            </ul>
                          ),
                          li: ({ children }) => (
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{children}</span>
                            </li>
                          ),
                          hr: () => (
                            <hr className="my-4 border-border" />
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-foreground">
                              {children}
                            </strong>
                          ),
                          p: ({ children }) => (
                            <p className="mb-2 leading-relaxed">
                              {children}
                            </p>
                          )
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <span className="text-xs opacity-70 mt-1 block">
                    {formatTime(message.timestamp)}
                  </span>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 bg-secondary flex-shrink-0">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 bg-gradient-primary flex-shrink-0">
                  <AvatarFallback className="text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t pt-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              className="btn-gradient"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p id="ai-assistant-description" className="text-xs text-muted-foreground mt-2 text-center">
            💡 Dica: Seja específico sobre suas necessidades para receber recomendações mais precisas
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}