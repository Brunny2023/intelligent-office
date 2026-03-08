import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import AppLayout from "@/components/layout/AppLayout";
import ChannelList from "@/components/communication/ChannelList";
import MessageThread from "@/components/communication/MessageThread";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ArrowLeft, Hash } from "lucide-react";

const MessagesModule = () => {
  const { loading } = useOrganization();
  const [selectedChannel, setSelectedChannel] = useState<any>(null);

  if (loading) {
    return (
      <AppLayout title="Messages">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Messages">
      <div className="flex h-[calc(100vh-env(safe-area-inset-bottom,0px))] md:h-screen relative">
        {/* Sidebar — hidden on mobile when a channel is selected */}
        <div className={`${selectedChannel ? "hidden md:block" : "block"} w-full md:w-64 border-r border-border bg-card/50 p-4 shrink-0 overflow-y-auto`}>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-bold text-foreground mb-4"
          >
            Messages
          </motion.h2>
          <ChannelList
            onSelectChannel={setSelectedChannel}
            selectedChannelId={selectedChannel?.id}
          />
        </div>

        {/* Main content — full width on mobile */}
        <div className={`${selectedChannel ? "block" : "hidden md:block"} flex-1`}>
          <AnimatePresence mode="wait">
            {selectedChannel ? (
              <motion.div
                key={selectedChannel.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col"
              >
                {/* Mobile back button */}
                <div className="md:hidden flex items-center gap-2 p-3 border-b border-border bg-card/50">
                  <button
                    onClick={() => setSelectedChannel(null)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground text-sm">{selectedChannel.name}</span>
                </div>
                <div className="flex-1">
                  <MessageThread
                    channelId={selectedChannel.id}
                    channelName={selectedChannel.name}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-6"
              >
                <MessageSquare className="w-16 h-16 text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Select a channel</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a channel or create a new one to start messaging
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
};

export default MessagesModule;
