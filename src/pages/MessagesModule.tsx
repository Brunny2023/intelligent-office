import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import AppLayout from "@/components/layout/AppLayout";
import ChannelList from "@/components/communication/ChannelList";
import MessageThread from "@/components/communication/MessageThread";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";

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
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-card/50 p-4 shrink-0 overflow-y-auto">
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

        {/* Main content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {selectedChannel ? (
              <motion.div
                key={selectedChannel.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <MessageThread
                  channelId={selectedChannel.id}
                  channelName={selectedChannel.name}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center"
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
